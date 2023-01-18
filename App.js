import {StatusBar} from 'expo-status-bar';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, Text, View, Button, Platform} from 'react-native';
import {CourierClient} from "@trycourier/courier";


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
        const {status: existingStatus} = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo push token:", token);
    } else {
        alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

async function sendPushNotification(expoPushToken) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Test title',
        body: 'Hello there',
        data: {testData: 'test data'},
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}


//
// import { CourierClient } from "@trycourier/courier";
//
// const courier = CourierClient({ authorizationToken: "pk_prod_RKQSB8QWCB4Z5FQRMYNX1Q67YYTQ" });
//
// async function sendPushNotification(expoPushToken) {
//  const { requestId } = await courier.send({
//    message: {
//      to: {
//        expo: {
//          token: expoPushToken,
//        }
//      },
//      content: {
//        title: "Welcome!",
//        body: "From Courier",
//      },
//      data: {
//        fakeData: "data",
//      },
//    },
//  });
// }



export default function App() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Your expo push token :</Text>
            <Text style={styles.subTitle}>{expoPushToken}</Text>
            <View style={styles.titleArea}>
                <Text>Notification Title: {notification && notification.request.content.title} </Text>
                <Text>Notification Body: {notification && notification.request.content.body}</Text>
                <Text>Notification Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
            </View>
            <Text style={styles.notificationBtn}
                onPress={async () => {
                    await sendPushNotification(expoPushToken);
                }}>
                Press to Send Notification
            </Text>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fedcf0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontWeight: "bold",
        fontSize:16,
        margin:10,
        textAlign:"center"
    },
    subTitle:{
        textAlign:"center"
    },
    titleArea:{
        margin:10,
        borderWidth:2,
        borderRadius:10,
        padding:10,
        borderColor:"#402352"
    },

    notificationBtn:{
        marginTop:10,
        textAlign:"center",
        borderWidth:2,
        padding:7,
        borderRadius:7,
         borderColor:"#2777ff",
        backgroundColor:"#2777ff",
        color:"#fff"
    },
});