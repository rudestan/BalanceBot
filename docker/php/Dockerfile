FROM php:7.1.9-fpm

RUN apt-get update \
    && apt-get install -y \
        curl \
        wget \
        git \
        libfontconfig1 \
        libfontconfig1-dev \
        cron

RUN apt-get update && apt-get install -y \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libmcrypt-dev \
        libpng12-dev \
        libicu-dev \
        libicu52  \
    && docker-php-ext-install iconv \
    && docker-php-ext-install exif \
    && docker-php-ext-install mbstring \
    && docker-php-ext-install pdo_mysql \
    && docker-php-ext-install pdo \
    && docker-php-ext-install intl \
    && docker-php-ext-install opcache \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install gd \
    && docker-php-ext-install zip

RUN apt-get update && apt-get install -y libmemcached-dev \
    && pecl install memcached \
    && docker-php-ext-enable memcached

# phantom js
RUN cd ~ \
    && wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 \
    && tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2 \
    && cp ~/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY php.ini        /usr/local/etc/php/conf.d/
COPY default.conf    /usr/local/etc/php-fpm.d/www.conf

# cron
COPY crontab    /etc/cron.d/
RUN chmod 0644 /etc/cron.d/crontab \
    && touch /var/log/cron.log


COPY docker-entry-point /usr/local/bin/

ENTRYPOINT ["docker-entry-point"]

CMD ["php-fpm"]

EXPOSE 9000
