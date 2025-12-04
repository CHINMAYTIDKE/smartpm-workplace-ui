import nodemailer from 'nodemailer';

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface TaskReminderEmailData {
  to: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: Date;
  workspaceName: string;
  taskUrl?: string;
}

/**
 * Send task due date reminder email
 */
export async function sendTaskReminderEmail(data: TaskReminderEmailData): Promise<boolean> {
  try {
    const formattedDueDate = new Date(data.dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 Task Reminder</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${data.assigneeName}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">This is a friendly reminder that your task is due in <strong>one week</strong>.</p>
            
            <div style="background: #f7f7f7; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">📝 ${data.taskTitle}</h2>
              ${data.taskDescription ? `<p style="color: #666; margin: 10px 0;">${data.taskDescription}</p>` : ''}
              <p style="margin: 10px 0;"><strong>Due Date:</strong> <span style="color: #e74c3c;">${formattedDueDate}</span></p>
              <p style="margin: 10px 0;"><strong>Workspace:</strong> ${data.workspaceName}</p>
            </div>
            
            ${data.taskUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.taskUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View Task</a>
              </div>
            ` : ''}
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
            
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              💡 <strong>Tip:</strong> Set aside some time this week to work on this task to avoid last-minute rush.
            </p>
            
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              This is an automated reminder from FlowTrack Workplace. You're receiving this because you're assigned to this task.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Hi ${data.assigneeName},

This is a friendly reminder that your task is due in one week.

Task: ${data.taskTitle}
${data.taskDescription ? `Description: ${data.taskDescription}` : ''}
Due Date: ${formattedDueDate}
Workspace: ${data.workspaceName}

${data.taskUrl ? `View task: ${data.taskUrl}` : ''}

This is an automated reminder from FlowTrack Workplace.
    `.trim();

    await transporter.sendMail({
      from: `"FlowTrack Workplace" <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: `⏰ Reminder: "${data.taskTitle}" is due in 1 week`,
      html: emailHtml,
      text: emailText,
    });

    console.log('Email sent successfully via Gmail');
    return true;
  } catch (error) {
    console.error('Failed to send task reminder email:', error);
    return false;
  }
}

/**
 * Send batch reminder emails
 */
export async function sendBatchTaskReminders(reminders: TaskReminderEmailData[]): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const success = await sendTaskReminderEmail(reminder);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed };
}
