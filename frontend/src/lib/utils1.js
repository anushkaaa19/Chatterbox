// src/lib/utils.js

// Utility to join class names dynamically
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
  }
  
  // You can add more utility functions here as needed
  // Example: To merge objects
  export function mergeObjects(obj1, obj2) {
    return { ...obj1, ...obj2 };
  }
  
  // Example: To format dates
  export function formatDate(date) {
    return new Date(date).toLocaleDateString();
  }
  