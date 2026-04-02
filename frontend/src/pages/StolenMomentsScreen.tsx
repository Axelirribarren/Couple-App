import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Image, Dimensions, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

// Temporarily ignore the strict TS typing for FileSystem module exports
// @ts-ignore
const STOLEN_MOMENTS_DIR = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}stolen_moments/`;

export default function StolenMomentsScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [photos, setPhotos] = useState<any[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        const init = async () => {
            await setupDirectory();
            await loadPhotos();
        };
        init();
    }, []);

    const setupDirectory = async () => {
        const dirInfo = await FileSystem.getInfoAsync(STOLEN_MOMENTS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(STOLEN_MOMENTS_DIR, { intermediates: true });
        }
    };

    const loadPhotos = async () => {
        try {
            const files = await FileSystem.readDirectoryAsync(STOLEN_MOMENTS_DIR);

            // Read metadata for each photo
            const photoData = await Promise.all(
                files.filter(f => f.endsWith('.jpg')).map(async (filename) => {
                    const uri = STOLEN_MOMENTS_DIR + filename;
                    const jsonUri = uri.replace('.jpg', '.json');
                    let metadata = { timestamp: Date.now(), location: null };
                    try {
                        const jsonStr = await FileSystem.readAsStringAsync(jsonUri);
                        metadata = JSON.parse(jsonStr);
                    } catch (e) {
                        // Ignore missing JSON
                    }
                    return { id: filename, uri, ...metadata };
                })
            );

            // Sort newest first
            photoData.sort((a, b) => b.timestamp - a.timestamp);
            setPhotos(photoData);
        } catch (error) {
            console.error("Error loading stolen moments", error);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
                if (photo) {
                    setIsCameraActive(false); // Immediately close camera for fast flow

                    const timestamp = Date.now();
                    const filename = `moment_${timestamp}.jpg`;
                    const destPath = STOLEN_MOMENTS_DIR + filename;

                    // Move photo to permanent local storage
                    await FileSystem.moveAsync({
                        from: photo.uri,
                        to: destPath
                    });

                    // Try to get location quickly
                    let locationStr = null;
                    if (locationPermission?.granted) {
                        try {
                            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                            // Simple reverse geocoding if needed, or just save coords
                            locationStr = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
                        } catch (e) {}
                    }

                    // Save metadata JSON
                    const metadata = { timestamp, location: locationStr };
                    await FileSystem.writeAsStringAsync(
                        destPath.replace('.jpg', '.json'),
                        JSON.stringify(metadata)
                    );

                    loadPhotos(); // Refresh grid
                }
            } catch (e) {
                console.error("Failed to take picture", e);
                setIsCameraActive(false);
            }
        }
    };

    const openCamera = async () => {
        if (!permission?.granted) await requestPermission();
        if (!locationPermission?.granted) await requestLocationPermission();
        setIsCameraActive(true);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.gridItem}>
            <Image source={{ uri: item.uri }} style={styles.gridImage} />
            <Text style={styles.dateText}>
                {new Date(item.timestamp).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={photos}
                numColumns={3}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No stolen moments yet. Start capturing!</Text>}
            />

            <TouchableOpacity style={styles.fab} onPress={openCamera}>
                <Text style={styles.fabIcon}>📸</Text>
            </TouchableOpacity>

            <Modal visible={isCameraActive} animationType="slide">
                <View style={styles.cameraContainer}>
                    {permission?.granted ? (
                        <CameraView style={styles.camera} ref={cameraRef}>
                            <View style={styles.cameraOverlay}>
                                <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                                    <View style={styles.captureInner} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCameraActive(false)}>
                                    <Text style={styles.closeText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </CameraView>
                    ) : (
                        <Text style={styles.emptyText}>Camera permission needed.</Text>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    gridItem: {
        width: windowWidth / 3,
        height: windowWidth / 3,
        padding: 2,
    },
    gridImage: {
        flex: 1,
        borderRadius: 5,
        backgroundColor: '#eee',
    },
    dateText: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        fontSize: 10,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 4,
        borderRadius: 3,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#ff4500',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    fabIcon: {
        fontSize: 24,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'white',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 30,
    },
    closeText: {
        color: 'white',
        fontSize: 18,
    }
});