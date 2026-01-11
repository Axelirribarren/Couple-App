import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { Photo } from '../types';

// CHANGE THIS TO MATCH API_URL in api.ts
const BASE_URL = 'http://192.168.123.39:8000'; 

interface PhotoCardProps {
    photo: Photo;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
    const imageUrl = `${BASE_URL}/${photo.file_path.replace(/\\/g, '/')}`;
    
    return (
        <View style={styles.container}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    image: {
        width: Dimensions.get('window').width - 20,
        height: 300,
        borderRadius: 10,
    },
});
