import { StyleSheet } from 'react-native';
export const mainColor = "#2A78CD";
const lightMainColor = "#4F95E0";
const lightColor = "#C9E0EE";
export const baseStyles = StyleSheet.create({
	maincolor:{
		color: mainColor,
	},
	lightColor: {
		color: lightColor,
	},
	lightMainColor: {
		color: lightMainColor,
	},
	h1: {
		fontSize: 35,
		color: lightColor,
		fontFamily: "Gantari_700Bold"
	},
	h2: {
		color: mainColor,
		fontSize: 30,
		fontFamily: "Gantari_700Bold"
	},
	h3: {
		color: lightMainColor,
		fontSize: 27,
		fontFamily: "Gantari_700Bold"
	},
	shadow: {
		elevation: 20,
		shadowColor: 'rgba(0,0,0,.4)'
	},
	shadowlight: {
		elevation: 5,
		shadowColor: 'rgba(0,0,0,.1)'
	},
	box:{
		borderRadius: 5,
		backgroundColor: '#fff',
		borderWidth: 0,
	},
	appBoldFont:{
		fontFamily:"Gantari_900Black"
	},
	appFont:{
		fontFamily:"Gantari_400Regular"
	},
	appFontLight:{
		fontFamily: "Gantari_200ExtraLight"
	},
	fill:{
		position: "absolute",
		top: 0, bottom:0, left: 0, right: 0,
	},
	row:{
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	}
});

export const elementStyles = StyleSheet.create({
	button: {
		margin: 10,
		padding: 15,
		borderRadius: 4,
		...baseStyles.shadowlight,
	},
	buttonText: {
		fontSize: 20,
		textAlign: 'center',
		...baseStyles.maincolor,
		...baseStyles.appBoldFont,
	},
	headerContain: {
		height: 80,
		zIndex: 4,
		shadowColor: "rgba(0,0,0,0)",
		padding: 10,
		position: "absolute",
		top: 0,
		flexDirection: "row",
		alignContent: 'center',
		justifyContent: "center",
		width:"100%",
	},
	headerIcon: {
		height: "100%",
		aspectRatio: "1/1",
		backgroundColor: "white",
		borderRadius: 10,
		justifyContent: "center",alignItems : "center",
		elevation: 10,
		shadowColor: baseStyles.maincolor.color
	},
});

export const typeStyles = StyleSheet.create({
  cardPlastron: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 20,
    paddingVertical: 30
  }
});