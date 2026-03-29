import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Custom from '../screens/Custom';
import HorizontalList from '../screens/HorizontalList';
import Native from '../screens/Native';
import { Text } from 'react-native';

const Stack = createNativeStackNavigator();
const StackNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Custom" component={Custom} options={({navigation}) =>({
          headerRight: ()=> <Text onPress={() => navigation.navigate("Native")}>Native</Text>
        })} />
        <Stack.Screen name="Native" component={Native} options={({navigation}) =>({
          headerRight: ()=> <Text onPress={() => navigation.navigate("HorizontalList")}>List</Text>
        })}/>
        <Stack.Screen name="HorizontalList" component={HorizontalList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigation;
