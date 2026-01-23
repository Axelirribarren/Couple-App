import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MoodScreen from './src/screens/MoodScreen';
import CharacterSelectionScreen from './src/screens/CharacterSelectionScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import TestScreen from './src/screens/TestScreen';
import AvatarWidget from './src/components/AvatarWidget';

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
    <AppStack.Screen name="Home" component={HomeScreen} options={{ 
        title: 'CoupleApp',
        headerRight: () => <AvatarWidget />
    }} />
    <AppStack.Screen name="Mood" component={MoodScreen} options={{ title: 'Add Mood' }} />
    <AppStack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Daily Check-In' }} />
    <AppStack.Screen name="Test" component={TestScreen} options={{ title: 'Emotional Test' }} />
    <AppStack.Screen name="CharacterSelection" component={CharacterSelectionScreen} options={{ headerShown: false }} />
  </AppStack.Navigator>

);

const RootNavigation = () => {
    const { token, isLoading, user } = useAuth();

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer>
            {token ? (
                user?.character ? <AppNavigator /> : <CharacterSelectionScreen navigation={{ replace: () => {} }} /> 
            ) : <AuthNavigator />}
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
