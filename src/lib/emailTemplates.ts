export function renderVerificationEmailHTML({
  fullName,
  verificationUrl,
}: {
  fullName: string;
  verificationUrl: string;
}): string {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      body, table, td, p, a, span {
        font-family: Arial, sans-serif;
      }
    </style>
  </head>
  <body style="margin:0; padding:20px; background:#f7f7f7;">
    <div style="
      max-width:480px;
      margin:0 auto;
      background:#ffffff;
      padding:24px;
      border-radius:12px;
      border:1px solid #e5e7eb;
    ">

      <!-- LOGO -->
      <table role="presentation" width="100%" style="border-collapse:collapse; margin:0 0 16px 0;">
        <tr>
          <td align="center">
            <div style="
              display:inline-block;
              background:linear-gradient(135deg,#2D9A4B,#1a7a35);
              border-radius:10px;
              padding:10px 18px;
            ">
              <span style="font-size:18px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                TJFinance
              </span>
            </div>
          </td>
        </tr>
      </table>

      <h2 style="margin:0 0 8px 0; font-size:20px; color:#111827;">
        Xác nhận đăng ký tài khoản
      </h2>

      <p style="font-size:14px; color:#111827; margin:0 0 8px 0;">
        Chào <strong>${fullName}</strong>, vui lòng nhấp vào nút bên dưới để xác nhận và kích hoạt tài khoản TJFinance của bạn.
      </p>

      <p style="font-size:14px; color:#111827; margin:0 0 16px 0;">
        Liên kết xác nhận sẽ hết hạn sau <strong>24 giờ</strong>.
      </p>

      <a href="${verificationUrl}"
         style="
           display:inline-block;
           padding:12px 20px;
           background:#2D9A4B;
           color:#ffffff;
           font-weight:600;
           font-size:14px;
           text-decoration:none;
           border-radius:8px;
         ">
        Xác nhận tài khoản
      </a>

      <p style="font-size:12px; color:#6b7280; margin-top:20px;">
        Nếu bạn không yêu cầu đăng ký tài khoản, bạn có thể bỏ qua email này.
      </p>

      <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;" />

      <div style="font-size:12px; color:#9ca3af; text-align:center;">
        <p style="margin:0;">© ${year} TJFinance · Quản lý tài chính cá nhân</p>
      </div>

    </div>
  </body>
</html>`;
}

export function renderPasswordResetEmailHTML({
  fullName,
  resetUrl,
}: {
  fullName: string;
  resetUrl: string;
}): string {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      body, table, td, p, a, span {
        font-family: Arial, sans-serif;
      }
    </style>
  </head>
  <body style="margin:0; padding:20px; background:#f7f7f7;">
    <div style="
      max-width:480px;
      margin:0 auto;
      background:#ffffff;
      padding:24px;
      border-radius:12px;
      border:1px solid #e5e7eb;
    ">
      <table role="presentation" width="100%" style="border-collapse:collapse; margin:0 0 16px 0;">
        <tr>
          <td align="center">
            <div style="
              display:inline-block;
              background:linear-gradient(135deg,#2D9A4B,#1a7a35);
              border-radius:10px;
              padding:10px 18px;
            ">
              <span style="font-size:18px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                TJFinance
              </span>
            </div>
          </td>
        </tr>
      </table>

      <h2 style="margin:0 0 8px 0; font-size:20px; color:#111827;">
        Đặt lại mật khẩu
      </h2>

      <p style="font-size:14px; color:#111827; margin:0 0 8px 0;">
        Chào <strong>${fullName}</strong>, bạn đã yêu cầu đặt lại mật khẩu cho tài khoản TJFinance.
      </p>

      <p style="font-size:14px; color:#111827; margin:0 0 16px 0;">
        Nhấn vào nút bên dưới để đi tới trang đặt lại mật khẩu.
      </p>

      <a href="${resetUrl}"
         style="
           display:inline-block;
           padding:12px 20px;
           background:#2D9A4B;
           color:#ffffff;
           font-weight:600;
           font-size:14px;
           text-decoration:none;
           border-radius:8px;
         ">
        Đặt lại mật khẩu
      </a>

      <p style="font-size:12px; color:#6b7280; margin-top:20px;">
        Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.
      </p>

      <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;" />

      <div style="font-size:12px; color:#9ca3af; text-align:center;">
        <p style="margin:0;">© ${year} TJFinance · Quản lý tài chính cá nhân</p>
      </div>
    </div>
  </body>
</html>`;
}

export function renderFeedbackEmailHTML({
  accountEmail,
  fullName,
  phone,
  message,
}: {
  accountEmail: string;
  fullName: string;
  phone: string;
  message: string;
}): string {
  const year = new Date().getFullYear();
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const safeAccountEmail = escapeHtml(accountEmail);
  const safeFullName = fullName ? escapeHtml(fullName) : "Không có";
  const safePhone = escapeHtml(phone);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      body, table, td, p, a, span, div {
        font-family: Arial, sans-serif;
      }
    </style>
  </head>
  <body style="margin:0; padding:20px; background:#f7f7f7;">
    <div style="
      max-width:560px;
      margin:0 auto;
      background:#ffffff;
      padding:24px;
      border-radius:12px;
      border:1px solid #e5e7eb;
    ">
      <table role="presentation" width="100%" style="border-collapse:collapse; margin:0 0 16px 0;">
        <tr>
          <td align="center">
            <div style="
              display:inline-block;
              background:linear-gradient(135deg,#2D9A4B,#1a7a35);
              border-radius:10px;
              padding:10px 18px;
            ">
              <span style="font-size:18px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                TJFinance
              </span>
            </div>
          </td>
        </tr>
      </table>

      <h2 style="margin:0 0 12px 0; font-size:20px; color:#111827;">
        Góp ý mới từ người dùng
      </h2>

      <div style="margin-bottom:16px; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
        <div style="padding:12px 16px; background:#f9fafb; border-bottom:1px solid #e5e7eb;">
          <p style="margin:0; font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;">
            Email tài khoản
          </p>
          <p style="margin:6px 0 0 0; font-size:14px; color:#111827;">
            ${safeAccountEmail}
          </p>
        </div>
        <div style="padding:12px 16px; background:#ffffff; border-bottom:1px solid #e5e7eb;">
          <p style="margin:0; font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;">
            Họ tên
          </p>
          <p style="margin:6px 0 0 0; font-size:14px; color:#111827;">
            ${safeFullName}
          </p>
        </div>
        <div style="padding:12px 16px; background:#f9fafb;">
          <p style="margin:0; font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;">
            Số điện thoại
          </p>
          <p style="margin:6px 0 0 0; font-size:14px; color:#111827;">
            ${safePhone}
          </p>
        </div>
      </div>

      <div style="border:1px solid #e5e7eb; border-radius:10px; padding:16px; background:#ffffff;">
        <p style="margin:0 0 10px 0; font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;">
          Nội dung góp ý
        </p>
        <div style="font-size:14px; line-height:1.6; color:#111827;">
          ${safeMessage}
        </div>
      </div>

      <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;" />

      <div style="font-size:12px; color:#9ca3af; text-align:center;">
        <p style="margin:0;">© ${year} TJFinance</p>
      </div>
    </div>
  </body>
</html>`;
}
