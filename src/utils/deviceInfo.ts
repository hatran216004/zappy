/**
 * Utility functions để detect thông tin thiết bị từ User Agent
 */

export interface DeviceInfo {
  deviceName: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  userAgent: string;
}

/**
 * Parse User Agent để lấy thông tin browser và OS
 */
export const parseUserAgent = (userAgent: string): Omit<DeviceInfo, 'deviceName' | 'userAgent'> => {
  const ua = userAgent.toLowerCase();

  // Detect Browser
  let browserName = 'Unknown';
  let browserVersion = '';

  if (ua.includes('edg/')) {
    browserName = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browserName = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('firefox/')) {
    browserName = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browserName = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browserName = 'Opera';
    const match = ua.match(/(?:opera|opr)\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detect OS
  let osName = 'Unknown';
  let osVersion = '';

  if (ua.includes('windows')) {
    osName = 'Windows';
    if (ua.includes('windows nt 10.0')) {
      osVersion = '10/11';
    } else if (ua.includes('windows nt 6.3')) {
      osVersion = '8.1';
    } else if (ua.includes('windows nt 6.2')) {
      osVersion = '8';
    } else if (ua.includes('windows nt 6.1')) {
      osVersion = '7';
    }
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    osName = 'macOS';
    const match = ua.match(/mac os x (\d+)[._](\d+)/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}`;
    }
  } else if (ua.includes('linux')) {
    osName = 'Linux';
  } else if (ua.includes('android')) {
    osName = 'Android';
    const match = ua.match(/android (\d+(?:\.\d+)?)/);
    osVersion = match ? match[1] : '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = ua.includes('ipad') ? 'iPadOS' : 'iOS';
    const match = ua.match(/os (\d+)[._](\d+)/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}`;
    }
  }

  // Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';

  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    } else {
      deviceType = 'mobile';
    }
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType
  };
};

/**
 * Lấy thông tin thiết bị hiện tại
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  const parsed = parseUserAgent(userAgent);

  // Tạo device name từ thông tin đã parse
  const deviceName = `${parsed.osName}${parsed.osVersion ? ` ${parsed.osVersion}` : ''} - ${parsed.browserName}${parsed.browserVersion ? ` ${parsed.browserVersion}` : ''}`;

  return {
    ...parsed,
    deviceName,
    userAgent
  };
};

/**
 * Format device info để hiển thị trong email
 */
export const formatDeviceInfoForEmail = (deviceInfo: DeviceInfo): string => {
  const parts: string[] = [];

  if (deviceInfo.deviceType !== 'unknown') {
    parts.push(deviceInfo.deviceType.charAt(0).toUpperCase() + deviceInfo.deviceType.slice(1));
  }

  if (deviceInfo.osName !== 'Unknown') {
    parts.push(`${deviceInfo.osName}${deviceInfo.osVersion ? ` ${deviceInfo.osVersion}` : ''}`);
  }

  if (deviceInfo.browserName !== 'Unknown') {
    parts.push(`${deviceInfo.browserName}${deviceInfo.browserVersion ? ` ${deviceInfo.browserVersion}` : ''}`);
  }

  return parts.join(' • ') || 'Unknown Device';
};

