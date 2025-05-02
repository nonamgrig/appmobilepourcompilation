import AsyncStorage from "@react-native-async-storage/async-storage"

export const getStorage = async(name:string) => {
  const strRes = await AsyncStorage.getItem(name) || "null";
  
  return JSON.parse(strRes);
}

export const setStorage = async(name:string, setter: any | ((previous:any) => any)) => {
  let content;
  switch(typeof setter){
    case "function": 
      let previous = getStorage(name);
      content = setter(name)
      break;
    
    default:
      content = setter;

  }

  await AsyncStorage.setItem(name, JSON.stringify(content));

}