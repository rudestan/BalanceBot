<?php

namespace BalanceBot\Command;

use BalanceBot\Service\PhantomExecutor;
use BalanceBot\Service\Render;
use Teebot\Api\Command\AbstractCommand;
use Teebot\Api\Method\SendMessage;
use BalanceBot\Service\Cache;

class Balance extends AbstractCommand
{
    /**
     * @var PhantomExecutor
     */
    protected $phantomExecutor;

    /**
     * @var Render
     */
    protected $render;

    /**
     * @var Cache
     */
    protected $cache;

    public function run()
    {
        if (empty($this->params)) {
            return;
        }

        foreach ($this->params as $name => $params) {

            $this->initWithParams($params);

            $data = $this->phantomExecutor->runScript();

            if ($data == null) {
                return null;
            }

            if ($this->cache) {
                if ($this->cache->dataHasChanged($data) === false) {
                    return null;
                }

                $this->cache->update($data);
            }

            $this->render->setHeader($params['bank']);

            $html = $this->render->renderAsHTML($data);

            $this->sendToAllChats($this->getChatId(), $html);
        }
    }

    protected function initWithParams(array $params)
    {
        $phantomScript = realpath(__DIR__ . '/../PhantomScripts/' . $params['phantom_script']);
        $phantomArgs   = [
            $params['login_str'],
            $params['pin_str'],
            $params['key_str'],
        ];

        $this->phantomExecutor = new PhantomExecutor($phantomScript, $phantomArgs);
        $this->render          = new Render();

        $memcacheServer = $this->getMemcachedServer();

        if ($memcacheServer) {
            $this->cache = new Cache($memcacheServer);
        }
    }

    protected function sendToAllChats($currentChatId, $html)
    {
        $chatIds = $this->getChatIds();

        if(!is_array($chatIds)) {
            $chatIds = [];
        }

        if($currentChatId) {
            $chatIds[] = $currentChatId;
        }

        $chatIds = array_unique($chatIds);

        $method = (new SendMessage())
            ->setText($html)
            ->setHTMLParseMode();

        foreach ($chatIds as $chatId) {
            $method->setChatId($chatId);

            $this->processor->call($method, true);
        }
    }

    protected function sendHtml($chatId, $html)
    {
        $sendMessage = new SendMessage();
        $sendMessage
            ->setChatId($chatId)
            ->setHTMLParseMode()
            ->setText($html);

        $this->processor->call($sendMessage, true);
    }

    protected function getMemcachedServer()
    {
        return $this->processor->getConfig()->get('options.memcached_server');
    }

    protected function getChatIds()
    {
        return $this->cache->getWithPostfix(Subscribe::CACHE_KEY_POSTFIX);
    }
}
