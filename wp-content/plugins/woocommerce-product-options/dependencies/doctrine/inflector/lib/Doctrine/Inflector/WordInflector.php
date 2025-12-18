<?php

declare (strict_types=1);
namespace Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\Inflector;

interface WordInflector
{
    public function inflect(string $word): string;
}
