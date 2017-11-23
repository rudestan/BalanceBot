<?php

namespace BalanceBot\Service;

use Memcached;

class Cache
{
    const CACHE_KEY_PREFIX = 'teebot_balancebot_data';

    protected $memcached;

    protected $cacheKey;

    public function __construct($server, $port = 11211, $cacheKey = self::CACHE_KEY_PREFIX)
    {
        $this->cacheKey  = $cacheKey;
        $this->memcached = new Memcached();

        $this->memcached->addServer($server, $port);
    }

    public function dataHasChanged($data)
    {
        $cachedData = $this->memcached->get($this->cacheKey);

        if (!$cachedData) {
            return true;
        }

        $encodedData = json_encode($data);

        return !$this->isDataEqual($cachedData, $encodedData);
    }

    protected function isDataEqual($data1, $data2)
    {
        return sha1($data1) === sha1($data2);
    }

    public function update($data)
    {
        $serializedData = json_encode($data);

        $this->memcached->set($this->cacheKey, $serializedData);
    }

    public function getWithPostfix($key = '')
    {
        return $this->memcached->get($this->cacheKey . $key);
    }

    public function setWithPostfix($key = '', $value)
    {
        return $this->memcached->set($this->cacheKey . $key, $value);
    }
}
