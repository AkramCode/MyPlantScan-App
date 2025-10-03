import { Tabs } from "expo-router";
import { Home, Heart, Camera, Leaf, MoreHorizontal } from "lucide-react-native";
import React from "react";
import { useBreakpoints } from "@/hooks/use-breakpoints";

export default function TabLayout() {
  const { isTablet } = useBreakpoints();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#6B7280",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 14 : 12,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: "Garden",
          tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}