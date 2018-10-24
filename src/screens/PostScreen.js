import React from 'react';
import { ScrollView, Platform, StyleSheet, Image, TouchableOpacity, TextInput, Text, View } from "react-native";
import firebase from 'react-native-firebase';
import ModalSelector from 'react-native-modal-selector';
import { AppStyles, AppIcon, ModalSelectorStyle, HeaderButtonStyle } from '../AppStyles';
import TextButton from 'react-native-button';
import FastImage from 'react-native-fast-image'
import { Configuration } from '../Configuration';
import { connect } from 'react-redux';
import ImagePicker from 'react-native-image-picker';



class PostScreen extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        title: 'Add Listing',
        headerRight: (<TextButton
            onPress={() => { navigation.goBack(null) }}
            style={HeaderButtonStyle.rightButton}
        >Cancel</TextButton>),
    });

    constructor(props) {
        super(props);

        this.categoryRef = firebase.firestore().collection('Categories').orderBy('order', 'asc');
        this.unsubscribeCategory = null;

        this.state = {
            categories: [],
            title: 'Test title',
            description: 'Test Description',
            category: {},
            location: {
                latitude: Configuration.map.origin.latitude,
                longitude: Configuration.map.origin.longitude,
            },
            localPhotos: [],
            photoUrls: [],
            price: '1000',
            textInputValue: '',
            filter: {},
        };
    }


    onCategoryUpdate = (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
            const category = doc.data();
            data.push({ ...category, id: doc.id });
        });

        this.setState({
            categories: data,
            category: data[0],
            loading: false,
        });
    }

    componentDidMount() {
        this.unsubscribeCategory = this.categoryRef.onSnapshot(this.onCategoryUpdate)
    }

    componentWillUnmount() {
        this.unsubscribeCategory();
    }

    handlePriceInputChange = (price) => {
        let newText = '';
        let numbers = '0123456789';

        for (var i = 0; i < price.length; i++) {
            if (numbers.indexOf(price[i]) > -1) {
                newText = newText + price[i];
            }
        }

        this.setState({
            price: newText
        });
    }

    selectLocation = () => {
        this.props.navigation.navigate('SelectLocation', { location: this.state.location, onSelectLocationDone: this.onSelectLocationDone });
    }

    selectFilter = () => {
        this.props.navigation.navigate('Filter', { filter: this.state.filter, onSelectFilterDone: this.onSelectFilterDone });
    }

    onSelectLocationDone = (location) => {
        this.setState({ location: location });
    }

    onSelectFilterDone = (filter) => {
        this.setState(filter);
    }
    onPressAddPhotoBtn = () => {
        // More info on all the options is below in the API Reference... just some common use cases shown here
        const options = {
            title: 'Select a photo',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        /**
         * The first arg is the options object for customization (it can also be null or omitted for default options),
         * The second arg is the callback which sends object: response (more info in the API Reference)
         */
        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                this.setState({
                    localPhotos: [...this.state.localPhotos, response.uri],
                });
            }
        });
    }
    onPost = () => {
        const navigation = this.props.navigation;
        if (!this.state.title) {
            alert("title empty");
            return;
        }
        if (!this.state.description) {
            alert("description empty");
            return;
        }
        if (!this.state.price) {
            alert("price empty");
            return;
        }
        if (this.state.localPhotos.length == 0) {
            alert("Please pick photos");
            return;
        }

        if (Object.keys(this.state.filter).length == 0) {
            alert("Please set filters");
            return;
        }

        let photoUrls = [];

        uploadPromiseArray = [];
        this.state.localPhotos.forEach((uri) => {
            uploadPromiseArray.push(new Promise((resolve, reject) => {
                console.log("upload image")
                let filename = uri.substring(uri.lastIndexOf('/') + 1);
                const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri
                firebase.storage().ref(filename).putFile(uploadUri).then(function (snapshot) {
                    photoUrls.push(snapshot.downloadURL);
                    resolve();
                });
            }));
        });

        Promise.all(uploadPromiseArray).then(values => {
            console.log("Post listing");
            firebase.firestore().collection('Listings').add({
                user_id: this.props.user.id,
                category_id: this.state.category.id,
                description: this.state.description,
                latitude: this.state.location.latitude,
                longitude: this.state.location.longitude,
                mapping: this.state.filter,
                name: this.state.title,
                price: parseInt(this.state.price),
                coordinate: new firebase.firestore.GeoPoint(this.state.location.latitude, this.state.location.longitude),
                post_time: firebase.firestore.FieldValue.serverTimestamp(),
                //TODO:
                place: 'San Francisco, CA',
                cover_photo: photoUrls[0],
                list_of_photos: photoUrls,
            }).then(function (docRef) {
                navigation.goBack();
            }).catch(function (error) {
                alert(error);
            });
        }).catch(reason => {
            console.log(reason);
        });

    }
    render() {
        categoryData = this.state.categories.map((category, index) => (
            { key: category.id, label: category.name }
        ));
        categoryData.unshift({ key: 'section', label: 'Category', section: true });

        photos = this.state.localPhotos.map((photo, index) => (
            <FastImage style={styles.photo} source={{ uri: photo }} />
        ));
        return (
            <ScrollView style={styles.body}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Title</Text>
                    <TextInput style={styles.input} value={this.state.title} onChangeText={(text) => this.setState({ title: text })} placeholder="Start typing" placeholderTextColor={AppStyles.color.grey} underlineColorAndroid='transparent' />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <TextInput
                        multiline={true}
                        numberOfLines={2}
                        style={styles.input}
                        onChangeText={(text) => this.setState({ description: text })}
                        value={this.state.description}
                        placeholder="Start typing"
                        placeholderTextColor={AppStyles.color.grey}
                        underlineColorAndroid='transparent' />
                </View>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.title}>Price</Text>
                        <TextInput
                            style={styles.priceInput}
                            keyboardType='numeric'
                            value={this.state.price}
                            onChangeText={this.handlePriceInputChange}
                            placeholderTextColor={AppStyles.color.grey}
                            underlineColorAndroid='transparent' />
                    </View>
                    <ModalSelector
                        touchableActiveOpacity={0.9}
                        data={categoryData}
                        sectionTextStyle={ModalSelectorStyle.sectionTextStyle}
                        optionTextStyle={ModalSelectorStyle.optionTextStyle}
                        optionContainerStyle={ModalSelectorStyle.optionContainerStyle}
                        cancelContainerStyle={ModalSelectorStyle.cancelContainerStyle}
                        cancelTextStyle={ModalSelectorStyle.cancelTextStyle}
                        selectedItemTextStyle={ModalSelectorStyle.selectedItemTextStyle}
                        backdropPressToClose={true}
                        cancelText={'Cancel'}
                        initValue={this.state.category.name}
                        onChange={(option) => { this.setState({ category: { id: option.key, name: option.label } }) }}>
                        <View style={styles.row}>
                            <Text style={styles.title}>Category</Text>
                            <Text style={styles.value}>{this.state.category.name}</Text>
                        </View>
                    </ModalSelector>
                    <TouchableOpacity onPress={this.selectFilter}>
                        <View style={styles.row}>
                            <Text style={styles.title}>Filters</Text>
                            <Text style={styles.value}>Select...</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.selectLocation}>
                        <View style={styles.row}>
                            <Text style={styles.title}>Location</Text>
                            <Text style={styles.value}>Select...</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.addPhotoTitle}>Add Photos</Text>
                    <ScrollView style={styles.photoList} horizontal={true}>
                        {photos}
                        <TouchableOpacity onPress={this.onPressAddPhotoBtn.bind(this)}>
                            <View style={[styles.addButton, styles.photo]}>
                                <Image style={styles.photoIcon} source={AppIcon.images.heartFilled} />
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                    <TextButton containerStyle={styles.addButtonContainer} onPress={this.onPost} style={styles.addButtonText}>Post Listing</TextButton>

                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        backgroundColor: AppStyles.color.background,
    },
    container: {
        justifyContent: 'center',
        height: 65,
        alignItems: 'center',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: AppStyles.color.grey,
    },

    sectionTitle: {
        textAlign: 'left',
        alignItems: 'center',
        color: AppStyles.color.title,
        fontSize: 19,
        padding: 10,
        paddingTop: 15,
        paddingBottom: 15,
        fontFamily: AppStyles.fontName.bold,
        fontWeight: 'bold',
        borderBottomWidth: 2,
        borderBottomColor: AppStyles.color.grey,
    },
    input: {
        width: '100%',
        fontSize: 19,
        padding: 10,
        textAlignVertical: 'top',
        justifyContent: 'flex-start',
        paddingLeft: 0,
        paddingRight: 0,
        fontFamily: AppStyles.fontName.main,
        color: AppStyles.color.text,
    },
    priceInput: {
        flex: 1,
        textAlign: 'right',
        paddingRight: 0,
        fontFamily: AppStyles.fontName.main,
        color: AppStyles.color.text,
    },
    title: {
        flex: 1,
        textAlign: 'left',
        alignItems: 'center',
        color: AppStyles.color.title,
        fontSize: 19,
        fontFamily: AppStyles.fontName.bold,
        fontWeight: 'bold',
    },
    value: {
        textAlign: 'right',
        color: AppStyles.color.description,
        fontFamily: AppStyles.fontName.main,
    },
    section: {
        backgroundColor: 'white',
        marginBottom: 10,
    },
    row: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
    },
    addPhotoTitle: {
        color: AppStyles.color.title,
        fontSize: 25,
        paddingLeft: 20,
        marginTop: 20,
        fontFamily: AppStyles.fontName.bold,
        fontWeight: 'bold',
    },
    photoList: {
        height: 80,
        marginTop: 20,
        marginRight: 10,
    },
    photo: {
        marginLeft: 10,
        width: 80,
        height: 80,
        borderRadius: 10,
    },

    addButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppStyles.color.tint,
    },
    photoIcon: {
        width: 50,
        height: 50,
    },
    addButtonContainer: {
        backgroundColor: AppStyles.color.tint,
        borderRadius: 5,
        padding: 15,
        margin: 10,
        marginTop: 20,
    },
    addButtonText: {
        color: AppStyles.color.white
    },

});

const mapStateToProps = state => ({
    user: state.auth.user,
});

export default connect(mapStateToProps)(PostScreen);