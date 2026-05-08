"""
MIAMS - Predictive Analytics Microservice
Flask API for asset failure prediction and maintenance forecasting
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
from urllib.parse import urlparse

app = Flask(__name__)  
CORS(app)

# Parse DATABASE_URL (Neon.tech format)
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    parsed = urlparse(DATABASE_URL)
    DB_CONFIG = {
        'host': parsed.hostname,
        'database': parsed.path[1:],  # removes leading /
        'user': parsed.username,
        'password': parsed.password,
        'port': parsed.port or 5432,
        'sslmode': 'require'  # required for Neon
    }
else:
    # Fallback for local development
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'database': os.getenv('DB_NAME', 'MIAMS'),
        'user': os.getenv('DB_USER', 'asset_user'),
        'password': os.getenv('DB_PASSWORD', ''),
        'port': os.getenv('DB_PORT', '5432')
    }

# Model storage path
MODEL_PATH = './models'
os.makedirs(MODEL_PATH, exist_ok=True)

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_CONFIG)

def extract_features_for_asset(conn, asset_id, institution_id):
    """Extract features for a single asset"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get asset details
    cursor.execute("""
        SELECT a.*, 
               EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.acquisition_date)) * 12 +
               EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.acquisition_date)) as age_months
        FROM assets a
        WHERE a.id = %s AND a.institution_id = %s
    """, (asset_id, institution_id))
    asset = cursor.fetchone()
    
    if not asset:
        return None
    
    # Count transactions (usage)
    cursor.execute("""
        SELECT COUNT(*) as usage_count
        FROM transactions
        WHERE asset_id = %s AND performed_at >= CURRENT_DATE - INTERVAL '90 days'
    """, (asset_id,))
    usage = cursor.fetchone()
    
    # Count maintenance records - FIX: Use actual_cost instead of cost
    cursor.execute("""
        SELECT 
            COUNT(*) as repairs_count,
            AVG(COALESCE(actual_cost, estimated_cost, 0)) as avg_cost,
            MAX(end_date) as last_maintenance
        FROM maintenance_records
        WHERE asset_id = %s AND created_at >= CURRENT_DATE - INTERVAL '90 days'
    """, (asset_id,))
    maintenance = cursor.fetchone()
    
    # Calculate time between repairs
    cursor.execute("""
        SELECT created_at
        FROM maintenance_records
        WHERE asset_id = %s AND status = 'closed'
        ORDER BY created_at DESC
        LIMIT 2
    """, (asset_id,))
    repairs = cursor.fetchall()
    
    avg_time_between_repairs = None
    if len(repairs) == 2:
        days_diff = (repairs[0]['created_at'] - repairs[1]['created_at']).days
        avg_time_between_repairs = days_diff
    
    features = {
        'asset_id': asset_id,
        'institution_id': institution_id,
        'age_months': float(asset['age_months']) if asset['age_months'] else 0,
        'usage_count': usage['usage_count'] or 0,
        'repairs_last_90d': maintenance['repairs_count'] or 0,
        'avg_maintenance_cost': float(maintenance['avg_cost']) if maintenance['avg_cost'] else 0,
        'avg_time_between_repairs': float(avg_time_between_repairs) if avg_time_between_repairs else 365,
        'condition_score': {'good': 1.0, 'fair': 0.5, 'poor': 0.0}.get(asset['condition'], 0.5),
        'last_maintenance_date': maintenance['last_maintenance']
    }
    
    cursor.close()
    return features

def calculate_risk_score(features):
    """Calculate risk score using weighted heuristics"""
    # Normalize factors
    age_factor = min(features['age_months'] / 60.0, 1.0)  # Max at 5 years
    usage_factor = min(features['usage_count'] / 50.0, 1.0)  # Max at 50 uses/90d
    repair_factor = min(features['repairs_last_90d'] / 5.0, 1.0)  # Max at 5 repairs
    
    # Time between repairs (lower is worse)
    if features['avg_time_between_repairs'] > 0:
        repair_frequency_factor = max(0, 1 - (features['avg_time_between_repairs'] / 180.0))
    else:
        repair_frequency_factor = 0
    
    condition_factor = 1 - features['condition_score']
    
    # Weighted risk calculation
    risk_score = (
        age_factor * 0.20 +
        usage_factor * 0.15 +
        repair_factor * 0.25 +
        repair_frequency_factor * 0.25 +
        condition_factor * 0.15
    )
    
    return min(risk_score, 1.0)

def get_risk_level(score):
    """Convert risk score to risk level"""
    if score < 0.3:
        return 'LOW'
    elif score < 0.6:
        return 'MEDIUM'
    else:
        return 'HIGH'

def predict_failure_date(features, risk_score):
    """Predict potential failure date based on patterns"""
    if risk_score < 0.3:
        return None  # Low risk, no immediate concern
    
    # Calculate days until potential failure
    base_days = 180  # 6 months baseline
    
    # Adjust based on risk factors
    age_adjustment = features['age_months'] * -0.5
    repair_adjustment = features['repairs_last_90d'] * -10
    usage_adjustment = features['usage_count'] * -0.5
    
    days_until_failure = max(
        base_days + age_adjustment + repair_adjustment + usage_adjustment,
        7  # Minimum 7 days
    )
    
    # Scale by risk score
    days_until_failure = days_until_failure * (1 - risk_score)
    
    failure_date = datetime.now() + timedelta(days=int(days_until_failure))
    return failure_date.date()

@app.route('/api/analytics/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'MIAMS Predictive Analytics'})

@app.route('/api/analytics/extract-features/<int:institution_id>', methods=['POST'])
def extract_features(institution_id):
    """Extract features for all assets in an institution"""
    try:
        print(f"\n=== Extracting features for institution {institution_id} ===")
        conn = get_db_connection()
        print("✓ Database connection successful")
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get ALL assets for this institution (simpler query)
        cursor.execute("""
            SELECT id, status FROM assets 
            WHERE institution_id = %s
        """, (institution_id,))
        all_assets = cursor.fetchall()
        print(f"✓ Total assets in institution: {len(all_assets)}")
        
        if len(all_assets) > 0:
            print(f"  First asset: ID={all_assets[0]['id']}, Status={all_assets[0]['status']}")
        
        # Filter out retired/disposed assets
        assets = [a for a in all_assets if a['status'] not in ['retired', 'disposed']]
        print(f"✓ Active assets to process: {len(assets)}")
        
        features_list = []
        for i, asset in enumerate(assets, 1):
            print(f"Processing asset {i}/{len(assets)}: ID {asset['id']}")
            try:
                features = extract_features_for_asset(conn, asset['id'], institution_id)
                if features:
                    # Store in predictive_features table
                    cursor.execute("""
                        INSERT INTO predictive_features 
                        (institution_id, asset_id, feature_date, usage_count, 
                         repairs_last_90d, avg_time_between_repairs, last_maintenance_date,
                         asset_age_months, avg_maintenance_cost)
                        VALUES (%s, %s, CURRENT_DATE, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (asset_id, feature_date) 
                        DO UPDATE SET
                            usage_count = EXCLUDED.usage_count,
                            repairs_last_90d = EXCLUDED.repairs_last_90d,
                            avg_time_between_repairs = EXCLUDED.avg_time_between_repairs,
                            last_maintenance_date = EXCLUDED.last_maintenance_date,
                            asset_age_months = EXCLUDED.asset_age_months,
                            avg_maintenance_cost = EXCLUDED.avg_maintenance_cost
                    """, (
                        institution_id, features['asset_id'], features['usage_count'],
                        features['repairs_last_90d'], features['avg_time_between_repairs'],
                        features['last_maintenance_date'], features['age_months'],
                        features['avg_maintenance_cost']
                    ))
                    features_list.append(features)
                    print(f"  ✓ Stored features for asset {asset['id']}")
            except Exception as asset_error:
                print(f"  ✗ Error processing asset {asset['id']}: {str(asset_error)}")
                import traceback
                traceback.print_exc()
                continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ Successfully extracted features for {len(features_list)} assets\n")
        return jsonify({
            'success': True,
            'features_extracted': len(features_list),
            'message': f'Extracted features for {len(features_list)} assets'
        })
    
    except Exception as e:
        print(f"\n✗ ERROR in extract_features: {str(e)}")
        import traceback
        traceback.print_exc()
        print()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/analytics/calculate-risks/<int:institution_id>', methods=['POST'])
def calculate_risks(institution_id):
    """Calculate risk scores for all assets"""
    try:
        print(f"\n=== Calculating risks for institution {institution_id} ===")
        conn = get_db_connection()
        print("✓ Database connection successful")
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get ALL assets for this institution (simpler query)
        cursor.execute("""
            SELECT id, status FROM assets 
            WHERE institution_id = %s
        """, (institution_id,))
        all_assets = cursor.fetchall()
        print(f"✓ Total assets in institution: {len(all_assets)}")
        
        # Filter out retired/disposed assets
        assets = [a for a in all_assets if a['status'] not in ['retired', 'disposed']]
        print(f"✓ Active assets to process: {len(assets)}")
        
        risk_scores = []
        for i, asset in enumerate(assets, 1):
            print(f"Processing asset {i}/{len(assets)}: ID {asset['id']}")
            try:
                features = extract_features_for_asset(conn, asset['id'], institution_id)
                if features:
                    risk_score = calculate_risk_score(features)
                    risk_level = get_risk_level(risk_score)
                    failure_date = predict_failure_date(features, risk_score)
                    
                    print(f"  Risk: {risk_level} ({risk_score:.4f})")
                    
                    # Delete old entries to avoid duplicates
                    cursor.execute("""
                        DELETE FROM asset_risk_scores 
                        WHERE asset_id = %s AND institution_id = %s
                    """, (asset['id'], institution_id))
                    
                    # Store risk score
                    cursor.execute("""
                        INSERT INTO asset_risk_scores
                        (institution_id, asset_id, risk_score, risk_level, 
                         predicted_failure_date, model_version)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        institution_id, asset['id'], risk_score, risk_level,
                        failure_date, 'v1.0'
                    ))
                    
                    risk_scores.append({
                        'asset_id': asset['id'],
                        'risk_score': round(risk_score, 4),
                        'risk_level': risk_level,
                        'predicted_failure_date': failure_date.isoformat() if failure_date else None
                    })
                    print(f"  ✓ Stored risk score for asset {asset['id']}")
            except Exception as asset_error:
                print(f"  ✗ Error processing asset {asset['id']}: {str(asset_error)}")
                import traceback
                traceback.print_exc()
                continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✓ Successfully calculated risks for {len(risk_scores)} assets\n")
        return jsonify({
            'success': True,
            'risks_calculated': len(risk_scores),
            'scores': risk_scores
        })
    
    except Exception as e:
        print(f"\n✗ ERROR in calculate_risks: {str(e)}")
        import traceback
        traceback.print_exc()
        print()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/dashboard/<int:institution_id>', methods=['GET'])
def get_dashboard_data(institution_id):
    """Get analytics dashboard data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Risk distribution
        cursor.execute("""
            SELECT risk_level, COUNT(*) as count
            FROM asset_risk_scores
            WHERE institution_id = %s
            GROUP BY risk_level
        """, (institution_id,))
        risk_distribution = cursor.fetchall()
        
        # High risk assets
        cursor.execute("""
            SELECT 
                a.id, a.asset_code, a.name, a.condition,
                ars.risk_score, ars.risk_level, ars.predicted_failure_date,
                at.name as asset_type, d.name as department
            FROM asset_risk_scores ars
            JOIN assets a ON ars.asset_id = a.id
            LEFT JOIN asset_types at ON a.asset_type_id = at.id
            LEFT JOIN departments d ON a.department_id = d.id
            WHERE ars.institution_id = %s AND ars.risk_level = 'HIGH'
            ORDER BY ars.risk_score DESC
            LIMIT 10
        """, (institution_id,))
        high_risk_assets = cursor.fetchall()
        
        # Maintenance forecast (next 30 days)
        cursor.execute("""
            SELECT 
                a.id, a.asset_code, a.name,
                ars.predicted_failure_date,
                ars.risk_score
            FROM asset_risk_scores ars
            JOIN assets a ON ars.asset_id = a.id
            WHERE ars.institution_id = %s 
                AND ars.predicted_failure_date IS NOT NULL
                AND ars.predicted_failure_date <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY ars.predicted_failure_date ASC
        """, (institution_id,))
        maintenance_forecast = cursor.fetchall()
        
        # Usage patterns (top 10 most used assets)
        cursor.execute("""
            SELECT 
                a.id, a.asset_code, a.name,
                pf.usage_count,
                at.name as asset_type
            FROM predictive_features pf
            JOIN assets a ON pf.asset_id = a.id
            LEFT JOIN asset_types at ON a.asset_type_id = at.id
            WHERE pf.institution_id = %s
                AND pf.feature_date = CURRENT_DATE
            ORDER BY pf.usage_count DESC
            LIMIT 10
        """, (institution_id,))
        usage_patterns = cursor.fetchall()
        
        # Asset condition breakdown
        cursor.execute("""
            SELECT condition, COUNT(*) as count
            FROM assets
            WHERE institution_id = %s
            GROUP BY condition
        """, (institution_id,))
        condition_breakdown = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'risk_distribution': [dict(r) for r in risk_distribution],
                'high_risk_assets': [dict(a) for a in high_risk_assets],
                'maintenance_forecast': [dict(m) for m in maintenance_forecast],
                'usage_patterns': [dict(u) for u in usage_patterns],
                'condition_breakdown': [dict(c) for c in condition_breakdown]
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/asset-details/<int:asset_id>', methods=['GET'])
def get_asset_analytics(asset_id):
    """Get detailed analytics for a specific asset"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get asset risk info
        cursor.execute("""
            SELECT 
                a.id, a.asset_code, a.name, a.condition, a.status,
                ars.risk_score, ars.risk_level, ars.predicted_failure_date,
                pf.usage_count, pf.repairs_last_90d, pf.avg_maintenance_cost,
                pf.asset_age_months
            FROM assets a
            LEFT JOIN asset_risk_scores ars ON a.id = ars.asset_id
            LEFT JOIN predictive_features pf ON a.id = pf.asset_id 
                AND pf.feature_date = CURRENT_DATE
            WHERE a.id = %s
        """, (asset_id,))
        asset_data = cursor.fetchone()
        
        # Get maintenance history
        cursor.execute("""
            SELECT 
                maintenance_type, description, status, cost,
                start_date, end_date
            FROM maintenance_records
            WHERE asset_id = %s
            ORDER BY created_at DESC
            LIMIT 5
        """, (asset_id,))
        maintenance_history = cursor.fetchall()
        
        # Get usage trend (last 30 days)
        cursor.execute("""
            SELECT 
                feature_date, usage_count
            FROM predictive_features
            WHERE asset_id = %s
                AND feature_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY feature_date ASC
        """, (asset_id,))
        usage_trend = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Generate recommendations
        recommendations = []
        if asset_data and asset_data['risk_level']:
            if asset_data['risk_level'] == 'HIGH':
                recommendations.append('Schedule immediate inspection')
                recommendations.append('Consider preventive maintenance')
                if asset_data['avg_maintenance_cost'] and asset_data['avg_maintenance_cost'] > 1000:
                    recommendations.append('Evaluate replacement cost vs repair cost')
            elif asset_data['risk_level'] == 'MEDIUM':
                recommendations.append('Monitor asset closely')
                recommendations.append('Schedule maintenance within 60 days')
            else:
                recommendations.append('Continue normal usage')
                recommendations.append('Next inspection in 6 months')
        
        return jsonify({
            'success': True,
            'data': {
                'asset': dict(asset_data) if asset_data else None,
                'maintenance_history': [dict(m) for m in maintenance_history],
                'usage_trend': [dict(u) for u in usage_trend],
                'recommendations': recommendations
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)