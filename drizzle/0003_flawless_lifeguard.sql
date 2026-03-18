CREATE TABLE `notification_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int,
	`employeeId` int,
	`notificationType` enum('expiring_30_day','expiring_14_day','expiring_7_day','expired','daily_digest') NOT NULL,
	`employeeName` varchar(256),
	`documentCategory` varchar(64),
	`expirationDate` date,
	`sentTo` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('sent','failed','pending') DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertThreshold30Day` boolean DEFAULT true,
	`alertThreshold14Day` boolean DEFAULT true,
	`alertThreshold7Day` boolean DEFAULT true,
	`alertThresholdExpired` boolean DEFAULT true,
	`monitorClearances` boolean DEFAULT true,
	`monitorCertifications` boolean DEFAULT true,
	`monitorLicenses` boolean DEFAULT true,
	`monitorMedical` boolean DEFAULT true,
	`dailyDigest` boolean DEFAULT true,
	`immediateAlerts` boolean DEFAULT false,
	`lastCheckRun` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
