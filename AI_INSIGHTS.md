# AI Insights Feature

The AI Insights feature provides intelligent analysis of your plant's health using Google Gemini AI to analyze sensor data trends and provide actionable recommendations.

## Features

- **Historical Data Analysis**: Analyzes 24 hours of sensor data for comprehensive insights
- **Intelligent Alerts**: Detects patterns and anomalies in environmental conditions
- **Professional Reports**: Generates structured reports with health assessments and recommendations
- **Windows95-Style UI**: Animated popup window with retro design aesthetics
- **Real-time Generation**: On-demand report generation using latest sensor data

## Setup Instructions

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for configuration

### 2. Configure Environment Variables

Create a `.env.local` file in the `client` directory:

```bash
# Copy the example file
cp client/.env.example client/.env.local
```

Edit the `.env.local` file and add your Gemini API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Install Dependencies

The required dependencies are already included in package.json:
- `@google/generative-ai` - Google Gemini AI SDK
- `framer-motion` - For window animations

### 4. Access AI Insights

1. Start the development server: `npm run dev:local:concurrent`
2. Open the dashboard in your browser
3. Click "AI Insights" in the navigation bar
4. The system will automatically generate a report based on the last 24 hours of sensor data

## How It Works

### Data Collection
1. The system fetches historical sensor data for the past 24 hours
2. Data is analyzed for temperature, humidity, soil moisture, and light levels
3. Statistical analysis calculates averages, minimums, and maximums

### AI Analysis
1. Sensor data is formatted into a structured prompt
2. Google Gemini AI analyzes the data and environmental patterns
3. The AI generates a professional report with:
   - Overall health assessment
   - Environmental analysis
   - Notable events and alerts
   - Actionable recommendations

### Report Display
1. Results are displayed in a Windows95-style popup window
2. Animated entrance with glassmorphism design
3. Monospaced font for retro terminal aesthetic
4. Professional formatting with timestamps and disclaimers

## Report Structure

Each AI-generated report includes:

### Overall Health Assessment
Brief overview of the plant's current condition based on sensor data trends.

### Environmental Analysis
Detailed insights about:
- Temperature patterns and stability
- Humidity levels and variations
- Soil moisture trends
- Light exposure adequacy

### Notable Events
- Alerts triggered during the monitoring period
- Significant environmental changes
- Pattern anomalies detected

### Recommendations
1-2 specific, actionable suggestions for improving plant care based on the analysis.

## Customization

### Plant Information
Update plant details in `components/ai/AIInsights.tsx`:

```typescript
const plantData: PlantData = {
  name: 'Your Plant Name',
  type: 'Plant Species',
  stage: 'Growth Stage',
};
```

### Alert Thresholds
Modify alert conditions in `lib/ai-service.ts`:

```typescript
// Temperature alerts
if (tempStats.avg > 30) alerts.push('High temperature detected');
if (tempStats.avg < 10) alerts.push('Low temperature detected');
```

### Prompt Customization
Adjust the AI prompt in `generateDailyInsightPrompt()` to modify the analysis style and focus areas.

## Troubleshooting

### API Key Issues
- Ensure your Gemini API key is correctly set in `.env.local`
- Verify the API key has appropriate permissions
- Check the browser console for authentication errors

### No Historical Data
- Ensure your sensors have been running for at least a few hours
- Check that sensor data is being saved to the database
- Verify API endpoints are responding with historical data

### Report Generation Errors
- Check browser console for detailed error messages
- Verify network connectivity to Google AI services
- Ensure sensor data is in the expected format

### UI Issues
- Clear browser cache if styling appears broken
- Ensure framer-motion is properly installed
- Check for JavaScript errors in console

## Development Notes

### File Structure
```
client/src/
├── components/ai/
│   ├── AIInsights.tsx          # Main component
│   └── AIInsightWindow.tsx     # UI window component
├── lib/
│   └── ai-service.ts           # AI integration and data processing
└── app/globals.css             # Windows95-style CSS
```

### Key Dependencies
- `@google/generative-ai`: AI integration
- `framer-motion`: Animations
- `@tremor/react`: UI components
- `@remixicon/react`: Icons

### API Integration
The feature uses existing sensor history endpoints:
- `GET /api/sensor-history/:sensorType?days=1`

## Future Enhancements

Planned improvements include:
- Multiple time period options (daily, weekly, monthly)
- Plant-specific AI models and recommendations
- Integration with camera/image analysis
- Export functionality for reports
- Historical report comparison
- Custom alert threshold configuration
- Multi-plant analysis support

## Security Considerations

- API keys are client-side environment variables
- Consider implementing server-side AI calls for production
- Implement rate limiting for AI API calls
- Add user authentication for sensitive plant data
