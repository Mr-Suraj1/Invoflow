import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';


export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendEmail({to, subject, html} : {to: string, subject: string, html: string}) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }
}

   