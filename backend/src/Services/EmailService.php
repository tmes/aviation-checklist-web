<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private static ?PHPMailer $mailer = null;

    /**
     * Get configured PHPMailer instance
     */
    private static function getMailer(): PHPMailer
    {
        if (self::$mailer === null) {
            $mail = new PHPMailer(true);

            try {
                // Server settings
                $mail->isSMTP();
                $mail->Host = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = $_ENV['SMTP_USER'] ?? '';
                $mail->Password = $_ENV['SMTP_PASS'] ?? '';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = (int)($_ENV['SMTP_PORT'] ?? 587);

                // From address
                $mail->setFrom(
                    $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@aerocheck.com',
                    $_ENV['SMTP_FROM_NAME'] ?? 'Aerocheck'
                );

                // Encoding
                $mail->CharSet = 'UTF-8';

                self::$mailer = $mail;
            } catch (Exception $e) {
                throw new \RuntimeException("Email configuration error: {$e->getMessage()}");
            }
        }

        return clone self::$mailer;
    }

    /**
     * Build URL from template (fetches from database or uses default)
     *
     * @param string $templateKey Setting key from system_settings table
     * @param array $variables Variables to replace in template
     * @return string Complete URL
     */
    private static function buildUrl(string $templateKey, array $variables): string
    {
        // For now, use env variables directly
        // TODO: Fetch from system_settings table once SettingsService is implemented
        $appUrl = $_ENV['APP_URL'] ?? 'https://aerocheck.com';

        $templates = [
            'email.verify_url_template' => '{{app_url}}/verify-email?token={{token}}',
            'email.invite_url_template' => '{{app_url}}/invites/accept/{{token}}',
            'email.reset_password_url_template' => '{{app_url}}/reset-password?token={{token}}',
        ];

        $template = $templates[$templateKey] ?? '';

        // Replace variables
        $replacements = array_merge(['app_url' => $appUrl], $variables);

        $url = $template;
        foreach ($replacements as $key => $value) {
            $url = str_replace('{{' . $key . '}}', $value, $url);
        }

        return $url;
    }

    /**
     * Send email verification email
     *
     * @param string $email Recipient email
     * @param string $token Verification token
     * @param string $firstName Recipient first name
     * @throws Exception
     */
    public static function sendVerificationEmail(string $email, string $token, string $firstName): void
    {
        $mail = self::getMailer();

        try {
            // Recipients
            $mail->addAddress($email, $firstName);

            // Content
            $mail->isHTML(false); // Plain text email
            $mail->Subject = 'Verify your Aerocheck account';

            $verifyUrl = self::buildUrl('email.verify_url_template', ['token' => $token]);
            $expiryHours = $_ENV['EMAIL_VERIFICATION_EXPIRES_HOURS'] ?? 24;

            $mail->Body = <<<EMAIL
Hi $firstName,

Welcome to Aerocheck! Please verify your email address by clicking the link below:

$verifyUrl

This link expires in $expiryHours hours.

If you didn't create an account, you can ignore this email.

Best regards,
Aerocheck Team
EMAIL;

            $mail->send();
        } catch (Exception $e) {
            throw new \RuntimeException("Failed to send verification email: {$mail->ErrorInfo}");
        }
    }

    /**
     * Send organization invite email
     *
     * @param string $email Recipient email
     * @param string $token Invite token
     * @param string $organizationName Organization name
     * @param string $inviterName Name of person who sent invite
     * @param string $role Role being invited to (admin, instructor, member)
     * @throws Exception
     */
    public static function sendInviteEmail(
        string $email,
        string $token,
        string $organizationName,
        string $inviterName,
        string $role
    ): void {
        $mail = self::getMailer();

        try {
            // Recipients
            $mail->addAddress($email);

            // Content
            $mail->isHTML(false);
            $mail->Subject = "You're invited to join $organizationName on Aerocheck";

            $inviteUrl = self::buildUrl('email.invite_url_template', ['token' => $token]);
            $expiryDays = $_ENV['EMAIL_INVITE_EXPIRES_DAYS'] ?? 7;

            $mail->Body = <<<EMAIL
Hi,

$inviterName has invited you to join $organizationName on Aerocheck as a $role.

Click the link below to accept:
$inviteUrl

This invitation expires in $expiryDays days.

About $organizationName:
Join our aviation community to access shared checklists and collaborate with fellow pilots.

Best regards,
Aerocheck Team
EMAIL;

            $mail->send();
        } catch (Exception $e) {
            throw new \RuntimeException("Failed to send invite email: {$mail->ErrorInfo}");
        }
    }

    /**
     * Send password reset email
     *
     * @param string $email Recipient email
     * @param string $token Reset token
     * @param string $firstName Recipient first name
     * @throws Exception
     */
    public static function sendPasswordResetEmail(string $email, string $token, string $firstName): void
    {
        $mail = self::getMailer();

        try {
            // Recipients
            $mail->addAddress($email, $firstName);

            // Content
            $mail->isHTML(false);
            $mail->Subject = 'Reset your Aerocheck password';

            $resetUrl = self::buildUrl('email.reset_password_url_template', ['token' => $token]);

            $mail->Body = <<<EMAIL
Hi $firstName,

You requested to reset your password for Aerocheck. Click the link below to create a new password:

$resetUrl

This link expires in 1 hour.

If you didn't request this password reset, you can ignore this email.

Best regards,
Aerocheck Team
EMAIL;

            $mail->send();
        } catch (Exception $e) {
            throw new \RuntimeException("Failed to send password reset email: {$mail->ErrorInfo}");
        }
    }

    /**
     * Send welcome email after email verification
     *
     * @param string $email Recipient email
     * @param string $firstName Recipient first name
     * @throws Exception
     */
    public static function sendWelcomeEmail(string $email, string $firstName): void
    {
        $mail = self::getMailer();

        try {
            // Recipients
            $mail->addAddress($email, $firstName);

            // Content
            $mail->isHTML(false);
            $mail->Subject = 'Welcome to Aerocheck!';

            $appUrl = $_ENV['APP_URL'] ?? 'https://aerocheck.com';

            $mail->Body = <<<EMAIL
Hi $firstName,

Welcome to Aerocheck! Your email has been verified and your account is now active.

You can now:
- Create and manage aircraft
- Build custom checklists
- Join flying clubs and schools
- Access checklists offline with our PWA

Get started: $appUrl/dashboard

Happy flying!
Aerocheck Team
EMAIL;

            $mail->send();
        } catch (Exception $e) {
            // Don't throw - welcome email is not critical
            error_log("Failed to send welcome email: {$mail->ErrorInfo}");
        }
    }
}
