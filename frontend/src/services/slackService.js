import api from './api';

export const getAnnouncements = () => {
  return api.get('/api/slack/announcements');
};

export const getDMs = () => {
  return api.get('/api/slack/dms');
};

export const executeCommand = (commandName, slackId, textParam) => {
  return api.post(`/api/slack/commands?command=${encodeURIComponent(commandName)}&user_id=${slackId || 'U_SLACK_MOCK_123'}&text=${encodeURIComponent(textParam)}`);
};

export const bookInterviewSlot = (applicationId, slotText) => {
  return api.post('/api/slack/interact', {
    applicationId: parseInt(applicationId),
    slotText: slotText
  });
};

export const getSlackOAuthUrl = () => {
  return api.get('/api/auth/slack/login');
};
