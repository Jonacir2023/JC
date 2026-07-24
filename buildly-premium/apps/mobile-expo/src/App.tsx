import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  DashboardScreen,
  SearchScreen,
  AlertsScreen,
  SettingsScreen,
  LoginScreen,
} from './screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// GraphQL Client Setup
const createApolloClient = (token: string) => {
  const apiUrl = Constants.expoConfig?.extra?.buildlyApiUrl || 'http://localhost:3001';

  return new ApolloClient({
    ssrMode: false,
    link: new HttpLink({
      uri: `${apiUrl}/graphql`,
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    }),
    cache: new InMemoryCache(),
  });
};

function DashboardNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SearchHome" component={SearchScreen} />
    </Stack.Navigator>
  );
}

function AlertsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AlertsHome" component={AlertsScreen} />
    </Stack.Navigator>
  );
}

function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 12, marginBottom: 3 },
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{
          tabBarLabel: '📊 Dashboard',
          tabBarTestID: 'tab-dashboard',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{
          tabBarLabel: '🔍 Busca',
          tabBarTestID: 'tab-search',
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsNavigator}
        options={{
          tabBarLabel: '⚠️ Alertas',
          tabBarTestID: 'tab-alerts',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '⚙️ Config',
          tabBarTestID: 'tab-settings',
          headerShown: true,
          title: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apolloClient, setApolloClient] = useState<any>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Carrega token do storage
      const savedToken = await AsyncStorage.getItem('auth_token');

      if (savedToken) {
        setToken(savedToken);
        setApolloClient(createApolloClient(savedToken));
      } else {
        // Se não há token, usará client sem autenticação para login
        setApolloClient(createApolloClient(''));
      }
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (newToken: string) => {
    await AsyncStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setApolloClient(createApolloClient(newToken));
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setApolloClient(createApolloClient(''));
  };

  if (loading || !apolloClient) {
    return null;
  }

  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!token ? (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              initialParams={{ onLogin: handleLogin }}
            />
          ) : (
            <Stack.Screen name="Main" component={MainApp} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
