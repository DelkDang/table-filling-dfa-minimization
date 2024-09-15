/* eslint-disable no-loop-func */
import util from "util";

// Print statePairs in a table format
const printTable = (states, statePairs) => {
  console.log("State Pairs Table:");
  const len = states.length;
  let header = "\t";
  states.forEach((state) => {
    header += state + "\t";
  });
  console.log(header);

  for (let i = 0; i < len; i++) {
    let row = states[i] + "\t";
    for (let j = 0; j < len; j++) {
      if (i === j) {
        row += "\t";
      } else if (i < j) {
        const pairKey = `${states[i]},${states[j]}`;
        row += (statePairs[pairKey] ? "t" : "f") + "\t";
      } else {
        row += "\t";
      }
    }
    console.log(row);
  }
};

export const minimize = (originalAutomaton) => {
  console.log("----------------- Original DFA -----------------");
  console.log(
    "Original DFA:",
    util.inspect(originalAutomaton, { showHidden: false, depth: null })
  );

  console.log(
    "----------------- DFA Minimization (Table Filling) -----------------"
  );

  const { states, alphabet, transitions, initialState, acceptingStates } =
    originalAutomaton;

  // Initialize the table of pairs of states
  const statePairs = {};
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      statePairs[`${states[i]},${states[j]}`] = false; // Initially unmarked
    }
  }
  console.log("----------------- Init table -----------------");
  printTable(states, statePairs);

  // Mark pairs of final and non-final states
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const s1 = states[i];
      const s2 = states[j];
      const s1Final = acceptingStates.includes(s1);
      const s2Final = acceptingStates.includes(s2);

      if (s1Final !== s2Final) {
        statePairs[`${s1},${s2}`] = true;
      }
    }
  }
  console.log("----------------- Mark pairs -----------------");
  printTable(states, statePairs);

  // Iteratively mark state pairs based on transitions
  let updated = true;
  while (updated) {
    updated = false;
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const s1 = states[i];
        const s2 = states[j];
        if (statePairs[`${s1},${s2}`]) continue;

        for (let symbol of alphabet) {
          const s1Transition = transitions.find(
            (transition) =>
              transition.fromState === s1 && transition.symbol === symbol
          );
          const s2Transition = transitions.find(
            (transition) =>
              transition.fromState === s2 && transition.symbol === symbol
          );
          const t1 = s1Transition.toStates[0];
          const t2 = s2Transition.toStates[0];
          const pairKey = `${t1},${t2}`;
          const reversePairKey = `${t2},${t1}`;
          if (statePairs[pairKey] || statePairs[reversePairKey]) {
            statePairs[`${s1},${s2}`] = true;
            updated = true;
            console.log("----------------- Update -----------------");
            printTable(states, statePairs);
            break;
          }
        }
      }
    }
  }

  // Combine equivalent states
  const equivalentGroups = [];
  const seenStates = new Set(); // Track states that have been added to groups

  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const s1 = states[i];
      const s2 = states[j];
      const pairKey = `${s1},${s2}`;

      if (!statePairs[pairKey]) {
        if (!equivalentGroups[s1]) {
          equivalentGroups[s1] = [s1];
        }
        equivalentGroups[s1].push(s2);
        equivalentGroups[s2] = equivalentGroups[s1]; // Share the same group
        seenStates.add(s1);
        seenStates.add(s2);
      }
    }
  }

  // Add states that are not in any group (single states)
  states.forEach((state) => {
    if (!seenStates.has(state)) {
      equivalentGroups[state] = [state]; // Single state as its own group
    }
  });

  console.log("equivalentGroups value: ", equivalentGroups);

  const minimizedAutomaton = {
    states: [],
    alphabet,
    initialState: null,
    acceptingStates: [],
    transitions: [],
  };

  const representativeMap = {};
  Object.keys(equivalentGroups).forEach((state) => {
    const group = equivalentGroups[state];
    const representative = group.join(""); // Join all elements in the group
    group.forEach((s) => (representativeMap[s] = representative)); // Assign concatenated representative to each state
  });

  console.log("representativeMap value: ", representativeMap);

  minimizedAutomaton.states = [...new Set(Object.values(representativeMap))];
  minimizedAutomaton.initialState = representativeMap[initialState];
  minimizedAutomaton.acceptingStates = [
    ...new Set(acceptingStates.map((s) => representativeMap[s])),
  ];

  const transitionMap = {};
  transitions.forEach((transition) => {
    const fromState = representativeMap[transition.fromState];
    const toState = representativeMap[transition.toStates[0]];
    const symbol = transition.symbol;

    if (!transitionMap[`${fromState},${symbol}`]) {
      minimizedAutomaton.transitions.push({
        fromState,
        toStates: [toState],
        symbol,
      });
      transitionMap[`${fromState},${symbol}`] = toState;
    }
  });

  console.log(
    "Minimized DFA (Table Filling):",
    util.inspect(minimizedAutomaton, { showHidden: false, depth: null })
  );

  return { minimizedAutomaton };
};
