FROM php:8.2-apache

# Install PostgreSQL driver
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

COPY . /var/www/html/

COPY ../../composer.json /var/www/html/
COPY ../../vendor/ /var/www/html/vendor/

EXPOSE 80