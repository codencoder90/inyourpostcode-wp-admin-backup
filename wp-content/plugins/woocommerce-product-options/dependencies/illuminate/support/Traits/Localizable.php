<?php

namespace Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Support\Traits;

use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Container\Container;
trait Localizable
{
    /**
     * Run the callback with the given locale.
     *
     * @param  string  $locale
     * @param  \Closure  $callback
     * @return mixed
     */
    public function withLocale($locale, $callback)
    {
        if (!$locale) {
            return $callback();
        }
        $app = Container::getInstance();
        $original = $app->getLocale();
        try {
            $app->setLocale($locale);
            return $callback();
        } finally {
            $app->setLocale($original);
        }
    }
}
