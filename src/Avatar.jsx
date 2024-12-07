/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React, { useEffect, useRef, useState } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { randInt } from "three/src/math/MathUtils.js";

import { facialPositionMap } from "./mappings";

export function Model(props) {
  const { nodes, materials, scene } = useGLTF('/AmpereModel.glb');
  const [blink, setBlink] = useState(false);

  const lerpMorphTargets = (target, value, speed) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];

        if (
          index == undefined ||
          child.morphTargetInfluences[index] === undefined
        )
          return;
        child.morphTargetInfluences[index] = value;
      }
    });
  };

  const resetMorphTargets = () => {
    const ignoreList = [
      "eyeBlinkLeft",
      "eyeBlinkRight",
      "mouthSmileLeft",
      "mouthSmileRight",
    ];

    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const ignoredIndices = ignoreList.map(
          (target) => child.morphTargetDictionary[target]
        );

        const indices = Object.values(child.morphTargetDictionary);

        indices.forEach((index) => {
          if (!ignoredIndices.includes(index))
            child.morphTargetInfluences[index] = 0;
        });
      }
    });
  };

  const { animations } = useGLTF('/AmpereAnimations.glb');
  // console.log("animations", animations);

  const group = useRef();
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    actions[props.currentAnimation].reset().fadeIn(0.5).play();

    return () => actions[props.currentAnimation].fadeOut(0.5);
  }, [props.currentAnimation]);

  useFrame(() => {
    lerpMorphTargets("eyeBlinkLeft", blink ? 0.75 : 0, 0.5);
    lerpMorphTargets("eyeBlinkRight", blink ? 0.75 : 0, 0.5);
  });

  useEffect(() => {
    let blinkTimeout;

    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, randInt(1000, 5000));
    };

    nextBlink();

    return () => clearTimeout(blinkTimeout);
  }, []);

  const lastTimeRef = useRef(0);

  useFrame((state) => {
    const currentTime = state.clock.getElapsedTime();
    if (props.lipsync.firstFrame && props.lipsync.isAudioPlaying) {
      const frameElapsed = (currentTime - lastTimeRef.current) * 60;

      if (frameElapsed >= 1) {
        lastTimeRef.current = currentTime;
        let frameNumber = Math.round(frameElapsed);

        if (props.lipsync.frameQueue.length >= frameNumber) {
          const frameData = props.lipsync.frameQueue[frameNumber - 1];
          frameData.forEach((value, index) => {
            let newValue = value;
            if (index === 17 || index === 18) {
              newValue = value - 0.029;
            }

            lerpMorphTargets(facialPositionMap[index], newValue * 1, 1);
          });
          // Remove the frame before the current frame
          for (let i = 0; i < frameNumber; i++) {
            props.lipsync.removeFrame();
          }
        } else {
          props.lipsync.clearFrameQueue();
        }
      }
    } else {
      lastTimeRef.current = currentTime;
      if (!props.lipsync.isAudioPlaying) {
        resetMorphTargets();
      }
    }
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />

      {nodes.Wolf3D_Beard && (
        <skinnedMesh
          name="Wolf3D_Beard"
          geometry={nodes.Wolf3D_Beard.geometry}
          material={materials.Wolf3D_Beard}
          skeleton={nodes.Wolf3D_Beard.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Beard.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Beard.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Facewear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Facewear.geometry}
          material={materials.Wolf3D_Facewear}
          skeleton={nodes.Wolf3D_Facewear.skeleton}
        />
      )}

      {nodes.Wolf3D_Hair && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
      )}

      {nodes.Wolf3D_Glasses && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Glasses.geometry}
          material={materials.Wolf3D_Glasses}
          skeleton={nodes.Wolf3D_Glasses.skeleton}
        />
      )}
      {nodes.Wolf3D_Headwear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Headwear.geometry}
          material={materials.Wolf3D_Headwear}
          skeleton={nodes.Wolf3D_Headwear.skeleton}
        />
      )}

      <skinnedMesh
        name="Wolf3D_Outfit_Top"
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Outfit_Top.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Outfit_Top.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Bottom"
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Outfit_Bottom.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Outfit_Bottom.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Outfit_Footwear"
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        morphTargetDictionary={
          nodes.Wolf3D_Outfit_Footwear.morphTargetDictionary
        }
        morphTargetInfluences={
          nodes.Wolf3D_Outfit_Footwear.morphTargetInfluences
        }
      />
      <skinnedMesh
        name="Wolf3D_Body"
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Body.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Body.morphTargetInfluences}
      />
    </group>
  );
}
