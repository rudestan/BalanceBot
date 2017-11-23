<?php

namespace BalanceBot\Service;

class PhantomExecutor
{
    const CMD_STRING = 'phantomjs --ssl-protocol=any %s %s';

    protected $baseScript;

    protected $args;

    public function __construct($baseScript, array $args)
    {
        $this->baseScript = $baseScript;
        $this->args = $args;
    }

    public function runScript()
    {
        if (!is_readable($this->baseScript)) {
            throw new \Exception(
                sprintf('The phantomJS script file "%s" is not readable!', $this->baseScript)
            );
        }

        $execString = sprintf(static::CMD_STRING, $this->baseScript, implode(" ", $this->args));

        try {
            $json = exec($execString);

            if (strlen((string)$json) == 0) {
                return null;
            }

            $data = json_decode($json);

            if (empty($data)) {
                return null;
            }

            return $data;
        } catch (\Exception $e) {
            return null;
        }
    }
}
