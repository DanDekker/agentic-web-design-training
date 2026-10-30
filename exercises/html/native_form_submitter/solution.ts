export interface NativeFormSubmitter {
  readonly form: object | null;
  readonly tagName: string;
  readonly type: string;
  readonly name?: string;
  readonly value?: string;
}

export interface NativeFormAction {
  readonly ownerDocument?: {
    readonly defaultView?: {
      readonly HTMLFormElement?: {
        readonly prototype?: {
          readonly requestSubmit?: (this: object, submitter?: NativeFormSubmitter) => void;
        };
      };
    };
  };
}

export interface NativeSubmitEvent {
  readonly currentTarget: object;
  readonly submitter: NativeFormSubmitter | null;
}

export interface NativeSubmitIntent {
  readonly name: string;
  readonly value: string;
}

function isSubmitButton(submitter: NativeFormSubmitter | null | undefined): boolean {
  if (!submitter || typeof submitter !== "object" || typeof submitter.tagName !== "string" || typeof submitter.type !== "string") {
    return false;
  }
  const tagName = submitter.tagName.toUpperCase();
  const type = submitter.type.toLowerCase();
  return (tagName === "BUTTON" && type === "submit") ||
    (tagName === "INPUT" && (type === "submit" || type === "image"));
}

export function requestNativeFormSubmission(form: NativeFormAction, submitter: NativeFormSubmitter): void {
  if (!form || typeof form !== "object") throw new TypeError("form must be an HTML form");
  if (!submitter || submitter.form !== form) throw new TypeError("submitter must belong to this form");
  if (!isSubmitButton(submitter)) throw new TypeError("submitter must be a submit button or image input");

  // A named control can mask form.requestSubmit; call the owning realm's prototype method.
  const requestSubmit = form.ownerDocument?.defaultView?.HTMLFormElement?.prototype?.requestSubmit;
  if (typeof requestSubmit !== "function") {
    throw new Error("Native HTMLFormElement.requestSubmit is unavailable");
  }
  requestSubmit.call(form, submitter);
}

export function getNativeSubmitIntent(event: NativeSubmitEvent): NativeSubmitIntent | null {
  if (!event || !event.currentTarget || typeof event.currentTarget !== "object") {
    throw new TypeError("event.currentTarget must be the submitted form");
  }
  const submitter = event.submitter;
  if (!submitter || submitter.form !== event.currentTarget || !isSubmitButton(submitter)) return null;
  if (typeof submitter.name !== "string" || submitter.name.length === 0) return null;
  return { name: submitter.name, value: String(submitter.value ?? "") };
}
