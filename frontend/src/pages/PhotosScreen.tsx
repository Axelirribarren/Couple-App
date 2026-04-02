import React, { useEffect, useState } from 'react';
import { View, Button, FlatList, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { Photo } from '../types';
import PhotoCard from '../components/PhotoCard';
import { useAuth } from '../context/AuthContext';
import { syncManager } from '../services/syncManager';

export default function PhotosScreen() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const { user } = useAuth(); // to trigger reload if needed

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const res = await api.get('/photos/');
            setPhotos(res.data);
        } catch (e) {
            console.log("Error loading photos", e);
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
        const formData = new FormData();
        // ImagePicker saves to a uri. We need to construct a proper file object for RN
        const localUri = asset.uri;
        const filename = localUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        // @ts-ignore
        formData.append('file', { uri: localUri, name: filename, type });

        try {
            await api.post('/photos/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert("Success", "Photo uploaded!");
            loadPhotos();
        } catch (e) {
            console.log(e);
            Alert.alert("Error", "Upload failed");
        }
    };

    const sendPolaroidSpark = async () => {
        // Take a photo using the camera
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.1, // Keep it small for base64 sending over sparks
            base64: true, // We encode it directly for the temporary Spark
        });

        if (!result.canceled && result.assets[0].base64) {
            try {
                const success = await syncManager.sendSpark('polaroid', result.assets[0].base64);
                if (success) {
                    Alert.alert("Mystery Polaroid Sent! 📸", "Your partner will receive a fragmented photo that they have to unlock.");
                } else {
                    Alert.alert("Error", "Could not send polaroid right now.");
                }
            } catch (e) {
                console.log(e);
                Alert.alert("Error", "Failed to send polaroid spark.");
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.buttonRow}>
                <View style={styles.btnWrapper}>
                    <Button title="Upload Photo" onPress={pickImage} />
                </View>
                <View style={styles.btnWrapper}>
                    <Button title="Send Mystery Polaroid 📸" color="#ff4500" onPress={sendPolaroidSpark} />
                </View>
            </View>
            <FlatList
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <PhotoCard photo={item} />}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    list: { marginTop: 10 },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    btnWrapper: {
        flex: 1,
        marginHorizontal: 5,
    }
});
