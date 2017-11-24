<?php

namespace BalanceBot\Command;

use Teebot\Api\Command\AbstractCommand;
use BalanceBot\Service\Cache;

class Subscribe extends AbstractCommand
{
    const CACHE_KEY_POSTFIX = '_chatids';

    public function run()
    {
        $pass      = $this->getPassFromArgs();
        $adminPass = $this->getAdminPass();

        if (empty($pass)) {
            $this->sendMessage('To subscribe on bank balance notifications you must provide admin password! Try again with password!');

            return;
        }

        if (!$this->isPasswordValid($pass, $adminPass)) {
            $this->sendMessage('Provided password is not valid! Please try again!');

            return;
        }

        if($this->subscribeChatId($this->getChatId())) {
            $this->sendMessage('You have been successfully subscribed for balance updates.');
        } else {
            $this->sendMessage('Failed to subscribe for balance updates!');
        }
    }

    /**
     * @return string
     */
    protected function getPassFromArgs()
    {
        if (empty($this->args)) {
            return '';
        }

        $args = explode(" ", $this->args);

        return $args[0];
    }

    /**
     * @return null
     */
    protected function getAdminPass()
    {
        return isset($this->params['security']['adminpass']) ? $this->params['security']['adminpass'] : null;
    }

    /**
     * @param $providedPassword
     * @param $adminPassword
     *
     * @return bool
     */
    protected function isPasswordValid($providedPassword, $adminPassword) {
        return md5($providedPassword) == $adminPassword;
    }

    /**
     * @param $chatId
     *
     * @return bool
     */
    protected function subscribeChatId($chatId)
    {
        $memcacheServer = $this->processor->getConfig()->get('options.memcached_server');

        if (!$memcacheServer) {
            return false;
        }

        $cache = new Cache($memcacheServer);

        $subscribedChats = $cache->getWithPostfix(static::CACHE_KEY_POSTFIX);

        if (!$subscribedChats) {
            $subscribedChats = [$chatId];
        } else {
            $subscribedChats[] = $chatId;
            $subscribedChats   = array_unique($subscribedChats);
        }

        return $cache->setWithPostfix(static::CACHE_KEY_POSTFIX, $subscribedChats);
    }
}