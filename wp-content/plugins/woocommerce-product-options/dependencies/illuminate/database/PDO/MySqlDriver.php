<?php

namespace Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\PDO;

use Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\DBAL\Driver\AbstractMySQLDriver;
use Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\PDO\Concerns\ConnectsToDatabase;
class MySqlDriver extends AbstractMySQLDriver
{
    use ConnectsToDatabase;
}
