<?php
/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

namespace Database;

class EncryptionHandler
{
	private $conn;
	private $encryptionFile;

	public function __construct()
	{
		$this->conn = DatabaseConnection::getDatabaseConnection();
		$this->encryptionFile = json_decode(file_get_contents('D:\dev\dbpassword\encryption_key.json'), true);
	}

	public function encryptCredentials()
	{
		$encryptedCredentials = openssl_encrypt(
			json_encode($this->encryptionFile['credentials']),
			'AES-256-CBC',
			$this->encryptionFile['encryption_key'],
			0,
			'1234567812345678',
		);
		file_put_contents('db_encrypted_config.txt', $encryptedCredentials);
	}

	public function storeUser($username, $password, $email)
	{
		$hashedPassword = password_hash($password, PASSWORD_ARGON2I);
		$stmt = $this->conn->prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
		$stmt->bind_param('sss', $username, $hashedPassword, $email);
		$stmt->execute();
	}
}
