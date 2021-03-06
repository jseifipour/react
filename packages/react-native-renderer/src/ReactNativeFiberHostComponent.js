/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  NativeMethods,
  ReactNativeBaseComponentViewConfig,
} from './ReactNativeTypes';
import type {Instance} from './ReactNativeHostConfig';

// Modules provided by RN:
import {
  TextInputState,
  UIManager,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {create} from './ReactNativeAttributePayload';
import {
  mountSafeCallback_NOT_REALLY_SAFE,
  warnForStyleProps,
} from './NativeMethodsMixinUtils';

import warningWithoutStack from 'shared/warningWithoutStack';

/**
 * This component defines the same methods as NativeMethodsMixin but without the
 * findNodeHandle wrapper. This wrapper is unnecessary for HostComponent views
 * and would also result in a circular require.js dependency (since
 * ReactNativeFiber depends on this component and NativeMethodsMixin depends on
 * ReactNativeFiber).
 */
class ReactNativeFiberHostComponent {
  _children: Array<Instance | number>;
  _nativeTag: number;
  viewConfig: ReactNativeBaseComponentViewConfig<>;

  constructor(tag: number, viewConfig: ReactNativeBaseComponentViewConfig<>) {
    this._nativeTag = tag;
    this._children = [];
    this.viewConfig = viewConfig;
  }

  blur() {
    TextInputState.blurTextInput(this._nativeTag);
  }

  focus() {
    TextInputState.focusTextInput(this._nativeTag);
  }

  measure(callback: MeasureOnSuccessCallback) {
    UIManager.measure(
      this._nativeTag,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback),
    );
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    UIManager.measureInWindow(
      this._nativeTag,
      mountSafeCallback_NOT_REALLY_SAFE(this, callback),
    );
  }

  measureLayout(
    relativeToNativeNode: number | ReactNativeFiberHostComponent,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    let relativeNode: ?number;

    if (typeof relativeToNativeNode === 'number') {
      // Already a node handle
      relativeNode = relativeToNativeNode;
    } else if (relativeToNativeNode._nativeTag) {
      relativeNode = relativeToNativeNode._nativeTag;
    }

    if (relativeNode == null) {
      if (__DEV__) {
        warningWithoutStack(
          'Warning: ref.measureLayout must be called with a node handle or a ref to a native component.',
        );
      }

      return;
    }

    UIManager.measureLayout(
      this._nativeTag,
      relativeNode,
      mountSafeCallback_NOT_REALLY_SAFE(this, onFail),
      mountSafeCallback_NOT_REALLY_SAFE(this, onSuccess),
    );
  }

  setNativeProps(nativeProps: Object) {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    const updatePayload = create(nativeProps, this.viewConfig.validAttributes);

    // Avoid the overhead of bridge calls if there's no update.
    // This is an expensive no-op for Android, and causes an unnecessary
    // view invalidation for certain components (eg RCTTextInput) on iOS.
    if (updatePayload != null) {
      UIManager.updateView(
        this._nativeTag,
        this.viewConfig.uiViewClassName,
        updatePayload,
      );
    }
  }
}

// eslint-disable-next-line no-unused-expressions
(ReactNativeFiberHostComponent.prototype: NativeMethods);

export default ReactNativeFiberHostComponent;
