<?php

namespace BalanceBot\Service;

class Render
{
    const ROW_TEMPLATE = "<pre>%s</pre> <b>%s€</b>";

    const ROW_TEMPLATE_HEADER_LINE = "<pre>%s</pre>";

    const ROW_TEMPLATE_FOOTER_LINE = "<pre>%s</pre>";

    const ROW_TEMPLATE_DATE = "<i>@ %s</i>";

    const ROW_TEMPLATE_HEADER = '<b>:: %s ::</b>';

    protected $header;

    public function setHeader($header)
    {
        $this->header = $header;
    }

    public function renderAsHTML(array $data)
    {
        $rows = [];

        if ($this->header) {
            $rows[] = sprintf(
                static::ROW_TEMPLATE_HEADER,
                $this->header
            );
        }

        $padName  = $this->getMaxLength($data, 'name');
        $padValue = $this->getMaxLength($data, 'value');
        $i        = 0;

        foreach ($data as $element) {
            $i++;

            $rows[] = sprintf(
                static::ROW_TEMPLATE,
                str_pad($element->name . ':', $padName + 1),
                str_pad($element->value, $padValue, ' ', STR_PAD_LEFT)
            );

            if ($i == 1) {
                $rows[] = sprintf(
                    static::ROW_TEMPLATE_HEADER_LINE, str_repeat('-', $padName + $padValue)
                );
            }
        }

        $rows[] = sprintf(
            static::ROW_TEMPLATE_FOOTER_LINE, str_repeat('_', $padName + $padValue)
        );

        $rows[] = sprintf(static::ROW_TEMPLATE_DATE, date('d.m.Y H:i'));

        return implode("\n", $rows);
    }

    protected function getMaxLength($data, $propertyName)
    {
        $maxLen = 0;
        foreach ($data as $row) {
            if (strlen($row->{$propertyName}) > $maxLen) {
                $maxLen = strlen($row->{$propertyName});
            }
        }

        return $maxLen;
    }
}
