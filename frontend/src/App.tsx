import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import HomeScreen from './pages/HomeScreen';
import MoodScreen from './pages/MoodScreen';
import PhotosScreen from './pages/PhotosScreen';
import CharacterSelectionScreen from './pages/CharacterSelectionScreen';
import AvatarWidget from './components/AvatarWidget';


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
    <AppStack.Screen name="Mood" component={MoodScreen} options={{ title: 'Add Entry' }} />
    <AppStack.Screen name="Photos" component={PhotosScreen} options={{ title: 'Photos' }} />
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
