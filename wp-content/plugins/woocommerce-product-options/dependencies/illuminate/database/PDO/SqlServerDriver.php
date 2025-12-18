<?php

namespace Barn2\Plugin\WC_Product_Options\Dependencies\Illuminate\Database\PDO;

use Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\DBAL\Driver\AbstractSQLServerDriver;
class SqlServerDriver extends AbstractSQLServerDriver
{
    /**
     * @return \Doctrine\DBAL\Driver\Connection
     */
    public function connect(array $params)
    {
        return new SqlServerConnection(new Connection($params['pdo']));
    }
}
