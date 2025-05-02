
import { useContext } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlastronDataContext } from "../providers/plastronContextProvider";
import { SetUpContext } from "../providers/setUpContextProvider";
import { IntervenantsListContext } from "../providers/intervenantsContextProvider";
import { ActionHistoryContext } from "../providers/actionHistoryContextProvider";
import { ActionsContext } from "../providers/actionsContextProvider";
import { PlastronPhysEvolutifContext } from "../providers/plastronPhysEvolutifContextProvider";
import { ModelPlastronContext } from "../providers/modelPlastronContextProvider";

export default function useResetApp(){
  const {setPlastronData} = useContext(PlastronDataContext);
  const {setSetUp} = useContext(SetUpContext);
  const {setIntervenantsList} = useContext(IntervenantsListContext);
  const {setActionHistory} = useContext(ActionHistoryContext);
  const {setActions} = useContext(ActionsContext);
  const {setPlastronPhysEvolutif} = useContext(PlastronPhysEvolutifContext);
  const {setModelPlastron} = useContext(ModelPlastronContext);

  return async () => {
    await AsyncStorage.clear();
    setPlastronData(null);
    setSetUp(false);
    setIntervenantsList([]);
    setActionHistory(new Map());
    setPlastronPhysEvolutif([]);
    setModelPlastron([]);
    setActions([]);
  }
}
