FROM php:8.2-apache

# Install PostgreSQL driver
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# Enable Apache mod_rewrite
RUN a2enmod rewrite headers

# Allow .htaccess overrides
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY . /var/www/html/

EXPOSE 80