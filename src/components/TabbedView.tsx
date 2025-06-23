import { Box, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';
import './TabbedView.css';

export interface TabItem {
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabbedViewProps {
  tabs: TabItem[];
  defaultTab?: number;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
  onTabChange?: (index: number) => void;
}

const TabbedView = ({
  tabs,
  defaultTab = 0,
  variant = 'fullWidth',
  orientation = 'horizontal',
  className = '',
  tabsClassName = '',
  contentClassName = '',
  onTabChange
}: TabbedViewProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    onTabChange?.(newValue);
  };

  return (
    <Box className={`tabbed-view ${className}`}>
      <Box className={`tabbed-view-tabs ${tabsClassName}`}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={variant}
          orientation={orientation}
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            '& .MuiTabs-indicator': {
              height: 2,
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              label={tab.label} 
              disabled={tab.disabled}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box className={`tabbed-view-content ${contentClassName}`}>
        {tabs[activeTab]?.content}
      </Box>
    </Box>
  );
};

export default TabbedView;
