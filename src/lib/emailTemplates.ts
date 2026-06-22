export function renderVerificationEmailHTML({
  fullName,
  verificationUrl,
}: {
  fullName: string;
  verificationUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xác nhận email - TJ Finance</title>
</head>
<body style="margin:0;padding:0;background:#050d09;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050d09;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background:linear-gradient(135deg,#2D9A4B,#1a7a35);
                    border-radius:16px;
                    padding:14px 20px;
                    box-shadow:0 0 30px rgba(45,154,75,0.4);
                  ">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      TJ<span style="color:#a7f3c3;">Finance</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="
              background:rgba(10,26,15,0.95);
              border:1px solid rgba(45,154,75,0.2);
              border-radius:24px;
              padding:40px 36px;
              box-shadow:0 25px 60px rgba(0,0,0,0.6);
            ">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="
                      display:inline-block;
                      width:64px;height:64px;
                      background:rgba(45,154,75,0.12);
                      border:2px solid rgba(45,154,75,0.3);
                      border-radius:20px;
                      text-align:center;
                      line-height:60px;
                      font-size:28px;
                      box-shadow:0 0 20px rgba(45,154,75,0.2);
                    ">✉️</div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#e2ffe8;letter-spacing:-0.3px;">
                      Xác nhận địa chỉ email
                    </h1>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:rgba(226,255,232,0.6);text-align:center;line-height:1.6;">
                      Chào <strong style="color:#4ade80;">${fullName}</strong>,<br/>
                      Cảm ơn bạn đã đăng ký tài khoản TJ Finance.<br/>
                      Nhấn nút bên dưới để xác nhận email và bắt đầu hành trình.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${verificationUrl}"
                       style="
                         display:inline-block;
                         background:linear-gradient(135deg,#2D9A4B,#1a7a35);
                         color:#ffffff;
                         text-decoration:none;
                         font-size:15px;
                         font-weight:700;
                         padding:14px 40px;
                         border-radius:14px;
                         box-shadow:0 6px 25px rgba(45,154,75,0.45);
                         letter-spacing:0.2px;
                       ">
                      ✅ Xác nhận email ngay
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <div style="height:1px;background:rgba(45,154,75,0.12);"></div>
                  </td>
                </tr>

                <!-- Alt link -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:13px;color:rgba(226,255,232,0.35);">
                      Hoặc copy link này vào trình duyệt:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="
                      margin:0;font-size:12px;
                      color:rgba(45,154,75,0.8);
                      word-break:break-all;
                      background:rgba(45,154,75,0.06);
                      border:1px solid rgba(45,154,75,0.15);
                      border-radius:10px;
                      padding:10px 14px;
                      line-height:1.5;
                    ">
                      ${verificationUrl}
                    </p>
                  </td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td>
                    <p style="
                      margin:0;font-size:12px;
                      color:rgba(226,255,232,0.3);
                      text-align:center;
                      line-height:1.6;
                    ">
                      Link có hiệu lực trong <strong style="color:rgba(226,255,232,0.5);">24 giờ</strong>.<br/>
                      Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:rgba(226,255,232,0.2);">
                © ${new Date().getFullYear()} TJ Finance · Quản lý tài chính cá nhân
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
