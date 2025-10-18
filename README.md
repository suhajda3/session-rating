# Session Rating App ⭐

A serverless, scalable session feedback system built on AWS, designed for conferences, meetups, and community events. Originally created for **AWS Community Day CEE** 🇪🇺

![AWS](https://img.shields.io/badge/AWS-Serverless-orange?logo=amazon-aws)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![License](https://img.shields.io/badge/license-MIT-green)
![Privacy](https://img.shields.io/badge/Privacy-Focused-success)

## ✨ Features

- 🎯 **Comprehensive Feedback** - Star ratings, yes/no questions, and open text feedback
- 🔐 **Speaker Access Control** - Speakers can view only their assigned sessions using ticket IDs
- 📊 **Analytics Dashboard** - Current statistics and feedback available on-demand
- ☁️ **Fully Serverless** - API Gateway, Lambda, DynamoDB - scales automatically
- 🚀 **One-Click Deploy** - Single CloudFormation template
- 🔒 **Privacy-Focused** - Anonymous attendee ratings, no tracking
- 📱 **Mobile Responsive** - Works on all devices

## 📁 Repository Structure

```
session-rating/
├── README.md
├── .gitignore
├── LICENSE
├── template.yaml                    # CloudFormation template
├── get-session.zip                  # Lambda: Fetch session details
├── submit-rating.zip                # Lambda: Submit ratings
├── get-ratings.zip                  # Lambda: View ratings (auth required)
└── frontend/                        # React application
    ├── public/                      # Static assets
    ├── src/                         # Source code
    ├── package.json
    ├── package-lock.json
    └── README.md
```

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│ API Gateway  │─────▶│   Lambda    │
│  Frontend   │      │   (CORS)     │      │  Functions  │
│   (S3 +     │      └──────────────┘      └─────┬───────┘
│ CloudFront) │                                  │
└─────────────┘      ┌───────────────────────────┴────────┐
                     │                                    │
              ┌──────▼──────┐   ┌──────────────┐   ┌────-─▼─────┐
              │  Sessions   │   │   Ratings    │   │  Speaker   │
              │   Table     │   │    Table     │   │  Tickets   │
              └─────────────┘   └──────────────┘   └────────────┘
                           DynamoDB (On-Demand)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Bootstrap 5 |
| CDN | CloudFront (HTTPS, global) |
| API | API Gateway REST |
| Compute | Lambda (Node.js 22.x) |
| Database | DynamoDB (on-demand) |
| Storage | S3 |
| IaC | CloudFormation |

## 🚀 Quick Start

### Prerequisites

- AWS Account with CLI configured
- S3 bucket for Lambda code
- Node.js 18+ and npm
- (Optional) CloudFront for HTTPS

### Deployment

**1. Clone and Upload Lambda Functions**

```bash
git clone https://github.com/suhajda3/session-rating.git
cd session-rating

# Upload pre-zipped Lambda functions
aws s3 cp get-session.zip s3://YOUR-LAMBDA-BUCKET/
aws s3 cp submit-rating.zip s3://YOUR-LAMBDA-BUCKET/
aws s3 cp get-ratings.zip s3://YOUR-LAMBDA-BUCKET/
```

**2. Deploy CloudFormation Stack**

```bash
aws cloudformation create-stack \
  --stack-name session-rating \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=session-rating \
    ParameterKey=DomainName,ParameterValue=surveys.yourdomain.com \
    ParameterKey=LambdaCodeBucket,ParameterValue=YOUR-LAMBDA-BUCKET \
  --capabilities CAPABILITY_NAMED_IAM
```

**3. Get API Gateway URL**

```bash
aws cloudformation describe-stacks \
  --stack-name session-rating \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text
```

**4. Build and Deploy Frontend**

```bash
cd frontend
npm install

# Configure API endpoint
echo "REACT_APP_API_GATEWAY_INVOKE_URL=https://xxxxxx.execute-api.eu-central-1.amazonaws.com/prod" > .env

npm run build

# Upload to S3
aws s3 sync build/ s3://surveys.yourdomain.com/
```

**5. Setup CloudFront (Recommended)**

Create a CloudFront distribution pointing to your S3 bucket for:
- ✅ HTTPS support
- ✅ Global CDN (faster loading worldwide)
- ✅ Custom domain with SSL certificate
- ✅ Better security

```bash
# Example: Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name surveys.yourdomain.com.s3.amazonaws.com \
  --default-root-object index.html
```

After CloudFront setup, update your CloudFormation `DomainName` parameter to your CloudFront domain and redeploy to update CORS settings.

**6. Configure DNS**

Point your domain to CloudFront distribution (recommended) or S3 website endpoint.

## 🎯 Setup Data

**1. Add Sessions:**

```bash
aws dynamodb put-item \
  --table-name session-rating-sessions \
  --item '{
    "sessionId": {"S": "COM001"},
    "eventName": {"S": "AWS Community Day CEE"},
    "sessionTitle": {"S": "Your Session Title"},
    "speakerName": {"S": "Speaker Name"}
  }'
```

**2. Configure Speaker Access:**

```bash
aws dynamodb put-item \
  --table-name session-rating-speaker-tickets \
  --item '{
    "ticketId": {"S": "ticket-001"},
    "ticketHolder": {"S": "Speaker Name"},
    "allowedSessions": {"SS": ["COM001"]},
    "isActive": {"BOOL": true}
  }'
```

**3. Create Admin Access:**

```bash
aws dynamodb put-item \
  --table-name session-rating-speaker-tickets \
  --item '{
    "ticketId": {"S": "admin-main"},
    "ticketHolder": {"S": "Event Organizer"},
    "allowedSessions": {"SS": ["*"]},
    "isActive": {"BOOL": true}
  }'
```

## 📖 Usage

### For Attendees 👥

**Rate a session:**
```
https://surveys.yourdomain.com/?sessionId=COM009
```

Generate QR codes pointing to this URL for easy access during sessions.

### For Speakers 🎤

**View ratings:**
```
https://surveys.yourdomain.com/?sessionId=COM009&view=ratings
```

Enter your ticket ID when prompted. Access is limited to your assigned sessions.

### For Organizers 👑

**Admin access to all sessions:**

Create a ticket with `allowedSessions: ["*"]`, then use that ticket ID to view any session's ratings.

## 📊 Feedback Collected

- ⭐ **Content Satisfaction** - 1-5 star rating (required)
- ⭐ **Speaker Effectiveness** - 1-5 star rating (required)
- ✅ **Learning Outcome** - Yes/No selection (required)
- 💬 **Additional Feedback** - Optional text field

Dashboard displays total responses, average ratings, learning percentage, and recent feedback.

## 🔒 Privacy & Security

- ✅ **Attendee-anonymous** - No user identification, cookies, or session tracking
- ✅ **Minimal data collection** - Only speaker names stored for access control
- ✅ **No analytics** - No IP logging, tracking pixels, or user profiling
- ✅ **Access control** - Ticket-based authentication for viewing ratings
- ✅ **CORS protection** - Configured allowed origins

## 📝 API Endpoints

```
GET    /sessions/{sessionId}                          - Get session details
POST   /rate                                           - Submit rating
GET    /sessions/{sessionId}/ratings?ticketId={id}    - Get ratings (auth required)
OPTIONS /*                                             - CORS preflight
```

**CORS Configuration:**
- Configured via CloudFormation `DomainName` parameter
- Allows: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`, `X-Amz-Date`, `Authorization`, `X-Api-Key`, `X-Amz-Security-Token`

## 🗄️ DynamoDB Structure

### Sessions Table (`session-rating-sessions`)

**Primary Key**: `sessionId` (String)

```json
{
  "sessionId": {
    "S": "COM009"
  },
  "eventName": {
    "S": "AWS Community Day CEE"
  },
  "sessionTitle": {
    "S": "Closing Keynote - AWS Community: choose your own adventure"
  },
  "speakerName": {
    "S": "María Encinar, Kristine Armiyants"
  }
}
```

### Ratings Table (`session-rating-ratings`)

**Primary Key**: `sessionId` (HASH) + `ratingId` (RANGE)  
**GSI**: `SessionRatingsIndex` on `sessionId`

```json
{
  "sessionId": {
    "S": "COM009"
  },
  "ratingId": {
    "S": "1760626526178#9334b032-b065-46e7-9a74-1880e9ff8bc5"
  },
  "additionalFeedback": {
    "S": "Good session, positive energy and interesting insights"
  },
  "contentSatisfaction": {
    "N": "5"
  },
  "eventName": {
    "S": "AWS Community Day CEE"
  },
  "learnedSomething": {
    "BOOL": true
  },
  "sessionTitle": {
    "S": "Closing Keynote - AWS Community: choose your own adventure"
  },
  "speakerEffectiveness": {
    "N": "5"
  },
  "speakerName": {
    "S": "María Encinar, Kristine Armiyants"
  },
  "submittedAt": {
    "S": "2025-10-16T14:55:26.178Z"
  }
}
```

### Speaker Tickets Table (`session-rating-speaker-tickets`)

**Primary Key**: `ticketId` (String)

**Regular Speaker Access:**
```json
{
  "ticketId": {
    "S": "644284325905084243834032"
  },
  "allowedSessions": {
    "SS": [
      "COM009"
    ]
  },
  "isActive": {
    "BOOL": true
  },
  "ticketHolder": {
    "S": "María Encinar"
  }
}
```

**Admin Access (All Sessions):**
```json
{
  "ticketId": {
    "S": "214771102294999581624729"
  },
  "allowedSessions": {
    "SS": [
      "*"
    ]
  },
  "isActive": {
    "BOOL": true
  },
  "ticketHolder": {
    "S": "Mihaly Balassy"
  }
}
```

**Notes:**
- `ticketId`: Any string identifier (e.g., Eventbrite number, custom ID, email)
- `allowedSessions`: Array of session IDs, or `["*"]` for admin access to all sessions
- Multiple sessions per speaker: `["COM001", "COM002", "COM003"]`
- Set `isActive: false` to revoke access without deleting the record

## 🎯 Use Cases

- ✅ **Tech Conferences** - AWS Community Days, re:Invent, KubeCon
- ✅ **Meetups** - Local user group meetings
- ✅ **Corporate Training** - Internal workshops
- ✅ **Webinars** - Online event feedback
- ✅ **University Courses** - Lecture feedback

## 🤝 Contributing

Contributions welcome! Fork the repository, create a feature branch, and open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mihaly Balassy**

Built with ❤️ by Mihaly Balassy for the AWS Community

- GitHub: [@suhajda3](https://github.com/suhajda3)
- Created for AWS Community Day CEE 2025 🇪🇺

## 📞 Support

- 📫 **Issues**: [GitHub Issues](https://github.com/suhajda3/session-rating/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/suhajda3/session-rating/discussions)

---

⭐ **Star this repo** if it's useful for your events!

💬 Questions? Open an issue or reach out to the community!

🎤 Using this at your event? I'd love to hear about it!
