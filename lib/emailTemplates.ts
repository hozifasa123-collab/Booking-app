
export const warnTemplate = (user: any, reason: string) => `
<div style="max-width: 600px; margin: 20px auto; font-family: sans-serif; border: 1px solid #fde68a; border-radius: 12px; overflow: hidden; background-color: #fffbeb;">
    <div style="background-color: #facc15; padding: 20px; text-align: center;">
        <h1 style="color: #854d0e; margin: 0; font-size: 24px;">⚠️ Official Warning</h1>
    </div>
    <div style="padding: 30px; color: #451a03;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Reason: ${reason}</p>
        <p>Total Warnings: <strong>${user.warnings}</strong></p>
    </div>
</div>
`;

export const suspendTemplate = (user: any, reason: string) => `
<div style="max-width: 600px; margin: 20px auto; font-family: sans-serif; border: 1px solid #fca5a5; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #ef4444; padding: 25px; text-align: center; color: white;">
        <h1>🚫 Account Suspended</h1>
    </div>
    <div style="padding: 30px; background-color: #fef2f2;">
        <p>Hello <strong>${user.name}</strong>, your account has been suspended.</p>
        <p>Reason: ${reason}</p>
    </div>
</div>
`;

export const reactivateTemplate = (user: any) => `
<div style="max-width: 600px; margin: 20px auto; font-family: sans-serif; border: 1px solid #bcf0da; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #10b981; padding: 25px; text-align: center; color: white;">
        <h1>✅ Account Reactivated</h1>
    </div>
    <div style="padding: 30px; background-color: #ffffff; text-align: center;">
        <p>Welcome back <strong>${user.name}</strong>! Your account is active again.</p>
        <a href="${process.env.NEXTAUTH_URL}/login" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
    </div>
</div>
`;