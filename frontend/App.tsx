import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MoodScreen from './src/screens/MoodScreen';
import PhotosScreen from './src/screens/PhotosScreen';

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const AppNavigator = () => (
  <AppStack.Navigator>
    <AppStack.Screen name="Home" component={HomeScreen} options={{ title: 'CoupleApp' }} />
    <AppStack.Screen name="Mood" component={MoodScreen} options={{ title: 'Add Entry' }} />
    <AppStack.Screen name="Photos" component={PhotosScreen} options={{ title: 'Photos' }} />
  </AppStack.Navigator>
);

const RootNavigation = () => {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a splash screen
    }

    return (
        <NavigationContainer>
            {token ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
