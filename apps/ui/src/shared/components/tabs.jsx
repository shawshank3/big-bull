// Tier 4 — Context Compound Component
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

// Internal context for boundary validation
const TabsContext = React.createContext(null);

function useTabsContext(componentName) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(`<${componentName}> must be rendered within a <Tabs> provider.`);
  }
  return context;
}

// Root: wraps Radix Root + provides local context
const Tabs = React.forwardRef(({ className, children, ...props }, ref) => (
  <TabsContext.Provider value={{ active: true }}>
    <TabsPrimitive.Root ref={ref} className={cn(className)} {...props}>
      {children}
    </TabsPrimitive.Root>
  </TabsContext.Provider>
));
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className, ...props }, ref) => {
  useTabsContext('TabsList');
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-bg p-1 text-muted',
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => {
  useTabsContext('TabsTrigger');
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-soft',
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => {
  useTabsContext('TabsContent');
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
