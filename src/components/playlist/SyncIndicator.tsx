// Sync Indicator Component

import React from 'react';
import { Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react';

interface SyncIndicatorProps {
  isSynced: boolean;
  lastSyncTime: number;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSynced,
  lastSyncTime
}) => {
  const timeSinceSync = Date.now() - lastSyncTime;
  const secondsAgo = Math.floor(timeSinceSync / 1000);
  
  const getTimeText = () => {
    if (secondsAgo < 5) return 'vừa xong';
    if (secondsAgo < 60) return `${secondsAgo}s trước`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m trước`;
    return `${Math.floor(secondsAgo / 3600)}h trước`;
  };

  const getSyncStatus = () => {
    if (isSynced && timeSinceSync < 5000) {
      return {
        icon: CheckCircle,
        text: 'Đã đồng bộ',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      };
    }
    
    if (isSynced) {
      return {
        icon: Wifi,
        text: 'Đã kết nối',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      };
    }
    
    return {
      icon: WifiOff,
      text: 'Đang đồng bộ...',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    };
  };

  const status = getSyncStatus();
  const Icon = status.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${status.bgColor}`}>
      <Icon className={`w-3 h-3 ${status.color}`} />
      <span className={status.color}>{status.text}</span>
      <div className="flex items-center space-x-1 text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{getTimeText()}</span>
      </div>
    </div>
  );
};
