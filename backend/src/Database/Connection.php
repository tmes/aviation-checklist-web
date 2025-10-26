<?php

namespace App\Database;

use PDO;
use PDOException;

class Connection
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            try {
                $host = $_ENV["DB_HOST"];
                $port = $_ENV["DB_PORT"];
                $dbname = $_ENV["DB_NAME"];
                $user = $_ENV["DB_USER"];
                $pass = $_ENV["DB_PASS"];

                self::$instance = new PDO(
                    "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                    $user,
                    $pass,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            } catch (PDOException $e) {
                throw new PDOException(
                    "Database connection failed: " . $e->getMessage()
                );
            }
        }

        return self::$instance;
    }

    public static function close(): void
    {
        self::$instance = null;
    }
}
