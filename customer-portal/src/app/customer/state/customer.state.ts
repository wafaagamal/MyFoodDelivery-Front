import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import {
  CustomerProfile,
  DeliveryAddress,
  PaymentMethod,
  LoyaltyInfo
} from '../models/customer.models';

// Actions
export class LoadProfile {
  static readonly type = '[Customer] Load Profile';
}

export class UpdateProfile {
  static readonly type = '[Customer] Update Profile';
  constructor(public payload: {
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
  }) {}
}

export class LoadAddresses {
  static readonly type = '[Customer] Load Addresses';
}

export class AddAddress {
  static readonly type = '[Customer] Add Address';
  constructor(public payload: {
    label: string;
    street: string;
    buildingNumber: string;
    floor: string | null;
    apartment: string | null;
    city: string;
    district: string | null;
    postalCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    deliveryInstructions: string | null;
    isDefault: boolean;
  }) {}
}

export class RemoveAddress {
  static readonly type = '[Customer] Remove Address';
  constructor(public addressId: string) {}
}

export class SetDefaultAddress {
  static readonly type = '[Customer] Set Default Address';
  constructor(public addressId: string) {}
}

export class LoadPaymentMethods {
  static readonly type = '[Customer] Load Payment Methods';
}

export class LoadLoyaltyInfo {
  static readonly type = '[Customer] Load Loyalty Info';
}

export class RedeemLoyaltyPoints {
  static readonly type = '[Customer] Redeem Loyalty Points';
  constructor(public points: number, public orderId?: string) {}
}

// State Model
export interface CustomerStateModel {
  profile: CustomerProfile | null;
  addresses: DeliveryAddress[];
  paymentMethods: PaymentMethod[];
  loyaltyInfo: LoyaltyInfo | null;
  loading: boolean;
  error: string | null;
}

@State<CustomerStateModel>({
  name: 'customer',
  defaults: {
    profile: null,
    addresses: [],
    paymentMethods: [],
    loyaltyInfo: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class CustomerState {
  constructor(private customerService: CustomerService) {}

  @Selector()
  static profile(state: CustomerStateModel): CustomerProfile | null {
    return state.profile;
  }

  @Selector()
  static addresses(state: CustomerStateModel): DeliveryAddress[] {
    return state.addresses;
  }

  @Selector()
  static defaultAddress(state: CustomerStateModel): DeliveryAddress | undefined {
    return state.addresses.find(a => a.isDefault);
  }

  @Selector()
  static paymentMethods(state: CustomerStateModel): PaymentMethod[] {
    return state.paymentMethods;
  }

  @Selector()
  static defaultPaymentMethod(state: CustomerStateModel): PaymentMethod | undefined {
    return state.paymentMethods.find(p => p.isDefault);
  }

  @Selector()
  static loyaltyInfo(state: CustomerStateModel): LoyaltyInfo | null {
    return state.loyaltyInfo;
  }

  @Selector()
  static loading(state: CustomerStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: CustomerStateModel): string | null {
    return state.error;
  }

  @Selector()
  static fullName(state: CustomerStateModel): string {
    if (!state.profile) return '';
    return `${state.profile.firstName} ${state.profile.lastName}`;
  }

  @Action(LoadProfile)
  loadProfile(ctx: StateContext<CustomerStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.customerService.getProfile().pipe(
      tap(profile => {
        ctx.patchState({ profile, loading: false });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return of(null);
      })
    );
  }

  @Action(UpdateProfile)
  updateProfile(ctx: StateContext<CustomerStateModel>, action: UpdateProfile) {
    ctx.patchState({ loading: true, error: null });

    return this.customerService.updateProfile(action.payload).pipe(
      tap(() => {
        const currentProfile = ctx.getState().profile;
        if (currentProfile) {
          ctx.patchState({
            profile: { ...currentProfile, ...action.payload },
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return of(null);
      })
    );
  }

  @Action(LoadAddresses)
  loadAddresses(ctx: StateContext<CustomerStateModel>) {
    return this.customerService.getAddresses().pipe(
      tap(addresses => {
        ctx.patchState({ addresses });
      }),
      catchError(error => {
        ctx.patchState({ error: error.message });
        return of([]);
      })
    );
  }

  @Action(AddAddress)
  addAddress(ctx: StateContext<CustomerStateModel>, action: AddAddress) {
    ctx.patchState({ loading: true, error: null });

    return this.customerService.addAddress(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new LoadAddresses());
        ctx.patchState({ loading: false });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return of(null);
      })
    );
  }

  @Action(RemoveAddress)
  removeAddress(ctx: StateContext<CustomerStateModel>, action: RemoveAddress) {
    return this.customerService.removeAddress(action.addressId).pipe(
      tap(() => {
        const addresses = ctx.getState().addresses.filter(a => a.id !== action.addressId);
        ctx.patchState({ addresses });
      }),
      catchError(error => {
        ctx.patchState({ error: error.message });
        return of(null);
      })
    );
  }

  @Action(SetDefaultAddress)
  setDefaultAddress(ctx: StateContext<CustomerStateModel>, action: SetDefaultAddress) {
    return this.customerService.setDefaultAddress(action.addressId).pipe(
      tap(() => {
        const addresses = ctx.getState().addresses.map(a => ({
          ...a,
          isDefault: a.id === action.addressId
        }));
        ctx.patchState({ addresses });
      }),
      catchError(error => {
        ctx.patchState({ error: error.message });
        return of(null);
      })
    );
  }

  @Action(LoadPaymentMethods)
  loadPaymentMethods(ctx: StateContext<CustomerStateModel>) {
    return this.customerService.getPaymentMethods().pipe(
      tap(paymentMethods => {
        ctx.patchState({ paymentMethods });
      }),
      catchError(error => {
        ctx.patchState({ error: error.message });
        return of([]);
      })
    );
  }

  @Action(LoadLoyaltyInfo)
  loadLoyaltyInfo(ctx: StateContext<CustomerStateModel>) {
    return this.customerService.getLoyaltyInfo().pipe(
      tap(loyaltyInfo => {
        ctx.patchState({ loyaltyInfo });
      }),
      catchError(error => {
        ctx.patchState({ error: error.message });
        return of(null);
      })
    );
  }

  @Action(RedeemLoyaltyPoints)
  redeemLoyaltyPoints(ctx: StateContext<CustomerStateModel>, action: RedeemLoyaltyPoints) {
    return this.customerService.redeemPoints(action.points, action.orderId).pipe(
      tap(result => {
        if (result.success) {
          ctx.dispatch(new LoadLoyaltyInfo());
        } else {
          ctx.patchState({ error: result.errorMessage || 'Failed to redeem points' });
        }
      }),
      catchError(error => {
        ctx.patchState({ error: error.message });
        return of(null);
      })
    );
  }
}
