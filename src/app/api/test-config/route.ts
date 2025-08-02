import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    AWS_S3_BUCKET: !!process.env.AWS_S3_BUCKET,
    AWS_REGION: !!process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
  }

  const missingVars = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  return NextResponse.json({
    config,
    missingVars,
    isConfigured: missingVars.length === 0,
    message: missingVars.length === 0 
      ? 'All AWS environment variables are configured' 
      : `Missing environment variables: ${missingVars.join(', ')}`
  })
}
