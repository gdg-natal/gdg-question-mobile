/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {
  AppRegistry,
  StyleSheet,
  Component,
  ListView,
  ScrollView,
  Text,
  View,
  Image,
  TextInput,
  Modal,
  TouchableHighlight
} from 'react-native';
import { Card, Button } from 'react-native-material-design';
//import Modal from 'react-native-modal';
import firebase from 'firebase';

firebase.intializeApp({
  apiKey: "AIzaSyAvo0cyFWV42m2BSKg_bWVryX79BDJNuIk",
  authDomain: "io16natal.firebaseapp.com",
  databaseURL: "https://io16natal.firebaseio.com",
  storageBucket: "io16natal.appspot.com",
});

class io16natalapp extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      isModalOpen: false,
      modalText: ''
    };
    ['chronogram', 'giveAway'].map(ref => { this[`${ref}Ref`] = this.getRef().child(ref) });
  }

  modalToggle(text, forceReOpen: false) {
    this.setState({modalText: text});
    this.setState({isModalOpen: forceReOpen || !this.state.isModalOpen});
  }

  modalClose() {
    this.setState({isModalOpen: false});
  }

  getRef() {
    return firebase.database().ref();
  }

  listenForChronogram(chronogramRef) {
    chronogramRef.on('value', (snap) => {
      var chronogram = [];
      snap.forEach((child) => {
        chronogram.push({
          val: child.val(),
          _key: child.key(),
          questions: child.child('questions').numChildren()
        });
      });
      chronogram.sort((a,b)=> a.val.time - b.val.time);
      console.log(chronogram);
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(chronogram)
      });

    });
  }

  listenForGiveAway(giveAwayRef) {
    giveAwayRef.on('child_added', (snap) => {
      let winner = snap.val();
      console.log(winner.timestamp);
      if (winner.timestamp + 5000 >= (new Date()).getTime()) {
        this.modalToggle(`${winner.username} foi sorteado publicando pelo ${winner.source} com a hashtag #io16natal`, true);
      }
    });
  }

  componentDidMount() {
    this.listenForChronogram(this.chronogramRef);
    this.listenForGiveAway(this.giveAwayRef);
  }

  _renderItem(item) {
    return (
      <ListItem item={item} that={this} modalQuestion={this.refs.modalQuestion}/>
    );
  }

  render() {
    return (
      <View style={styles.page}>

        <ScrollView>
          <ListView
            dataSource={this.state.dataSource}
            renderRow={this._renderItem.bind(this)}
            style={styles.listview}
          />
        </ScrollView>

        <ModalQuestion ref="modalQuestion" chronogramRef={this.chronogramRef} />
        <Modal visible={this.state.isModalOpen}
          onRequestClose={this.modalClose.bind(this)}>
          <TouchableHighlight onPress={this.modalClose.bind(this)} style={styles.container}>
            <View >
              <View style={styles.innerContainer}>
                <Text>{this.state.modalText}</Text>
              </View>
            </View>
          </TouchableHighlight>
        </Modal>
      </View>
    );
  }
}

class ListItem extends React.Component {

  render() {
    const item = this.props.item;
    const date = new Date(item.val.time);
    const pad = function(str) {
      str += '';
      return '00'.substring(0, 2 - str.length) + str;
    };
    return (
        <Card>
          <Card.Media
              image={<Image source={{uri:item.val.photo}} />}
              overlay
              height={300}
              children={<Text style={styles.name}>{item._key}</Text>}
          />
          <Card.Body>
            <Text style={{fontWeight: 'bold'}}>{item.val.role}</Text>
              <Text style={styles.liText}>{item.val.description}</Text>
            <Text style={styles.liText}>{`${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()}`}</Text>
          <Text style={styles.liText}>{`${pad(date.getHours())}:${pad(date.getMinutes())}`}</Text>
          </Card.Body>
          <Card.Actions position="right">
              <Button
              value={`Enviar Pergunta (${item.questions})`}
              onPress={() => this.props.modalQuestion.show(item._key)}/>
          </Card.Actions>
        </Card>
    );
  }
}

class ModalQuestion extends Modal {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false
    }
  }
  show(speaker) {
    this.setState({
      isVisible: true,
      speaker: speaker,
      sender: '',
      question: ''
    });
  }
  sendQuestion() {
    const chronogramRef = this.props.chronogramRef;
    const question = {
      sender: this.state.sender,
      question: this.state.question
    };
    chronogramRef.child(this.state.speaker).child('questions').push(question);
    this.setState({ isVisible: false });
  }
  render() {
    return (
      <Modal visible={this.state.isVisible}
        animated={true}
        tranparent={false}
        onRequestClose={() => this.setState({isVisible: false})}>
        <View style={styles.container}>
          <View style={styles.innerContainer}>
            <TextInput
              onChangeText={(sender) => this.setState({sender})}
              placeholder="Seu nome"/>
            <TextInput
              onChangeText={(question) => this.setState({question})}
              placeholder={`Sua pergunta para ${this.state.speaker}`}/>
            <Button value="Enviar" onPress={() => this.sendQuestion()}/>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  name: {
    color: '#ffffff',
    fontSize: 20
  }
});

AppRegistry.registerComponent('io16natalapp', () => io16natalapp);
