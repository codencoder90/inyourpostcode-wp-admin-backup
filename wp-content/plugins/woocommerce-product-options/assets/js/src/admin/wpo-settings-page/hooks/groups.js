/**
 * Wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

const getGroups = async () => {
	const groups = await apiFetch( {
		path: '/wc-product-options/v1/groups/all',
	} );

	return groups;
};

const getVisibilityObjects = async () => {
	const groups = await apiFetch( {
		path: '/wc-product-options/v1/groups/visibility',
	} );

	return groups;
};

export function useGroups( select ) {
	return useQuery( 'groups', getGroups, {
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		select,
	} );
}

export function useGroup( id ) {
	return useGroups( ( data ) => data.find( ( group ) => group.id === id ) );
}

export function useGroupVisibilityObjects( select ) {
	return useQuery( 'visibilityObjects', getVisibilityObjects, {
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		select,
	} );
}

export function useCreateGroup() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) =>
			apiFetch( {
				path: '/wc-product-options/v1/groups',
				method: 'POST',
				data,
			} ),
		{
			onSuccess: async () => {
				// await a refetch of the data so we have a real group ID
				await queryClient.refetchQueries( 'groups' );

				setNotification(
					'success',
					__( 'Option group successfully created', 'woocommerce-product-options' ),
					true,
					true
				);
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							'There was an issue while creating the group: %s<br>Please try again.',
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: async () => {
				await queryClient.invalidateQueries();
			},
		}
	);
}

export function useDuplicateGroup() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) =>
			apiFetch( {
				path: '/wc-product-options/v1/groups/duplicate',
				method: 'POST',
				data,
			} ),
		{
			onSuccess: async () => {
				setNotification(
					'success',
					__( 'Option group successfully created', 'woocommerce-product-options' ),
					true,
					true
				);
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							'There was an issue while duplicating the group: %s<br>Please try again.',
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: async () => {
				await queryClient.invalidateQueries();
			},
		}
	);
}

export function useImportGroups() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) =>
			apiFetch( {
				path: '/wc-product-options/v1/groups/import',
				method: 'POST',
				data,
			} ),
		{
			onSuccess: async () => {},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							'There was an issue while importing the option groups: %s<br>Please try again.',
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: async () => {
				await queryClient.invalidateQueries();
			},
		}
	);
}

export function useUpdateGroup() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) =>
			apiFetch( {
				path: '/wc-product-options/v1/groups?_method=PUT',
				method: 'PUT',
				data,
			} ),
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( data ) => {
				await queryClient.cancelQueries( 'groups' );

				const previousValue = queryClient.getQueryData( 'groups' );

				queryClient.setQueryData( 'groups', ( old ) => {
					old[ old.findIndex( ( group ) => group.id === data.id ) ] = data;

					return old;
				} );

				return previousValue;
			},
			onSuccess: ( data ) => {
				setNotification(
					'success',
					__( 'Option group successfully updated', 'woocommerce-product-options' ),
					true,
					true
				);

				if ( data?.options?.warnings?.length ) {
					data.options.warnings.forEach( ( warningMessage ) => {
						setNotification( 'warning', warningMessage );
					} );
				}
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							'There was an issue while updating the group: %s<br>Please try again.',
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: () => {
				queryClient.invalidateQueries( 'groups' );
				queryClient.invalidateQueries( 'options' );
			},
		}
	);
}

export function useDeleteGroup() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( groupID ) =>
			apiFetch( {
				path: '/wc-product-options/v1/groups?_method=DELETE',
				method: 'DELETE',
				data: {
					id: groupID,
				},
			} ),
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( groupID ) => {
				await queryClient.cancelQueries( 'groups' );

				const previousValue = queryClient.getQueryData( 'groups' );
				queryClient.setQueryData( 'groups', ( old ) => {
					const optimistic = old.filter( ( group ) => group.id !== groupID );

					return optimistic;
				} );

				return previousValue;
			},
			onSuccess: () => {
				setNotification(
					'success',
					__( 'Option group successfully deleted', 'woocommerce-product-options' ),
					true,
					true
				);
				// queryClient.invalidateQueries( 'groups' );
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							`There was an issue while deleting the group: %s. Please try again.`,
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: () => {
				// queryClient.invalidateQueries( 'groups' );
			},
		}
	);
}

export function useReOrderGroup() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( reOrderedGroups ) => {
			const reOrderedIds = reOrderedGroups.map( ( group ) => group.id );

			return apiFetch( {
				path: '/wc-product-options/v1/groups/reorder?_method=PUT',
				method: 'PUT',
				data: {
					reorder: reOrderedIds,
				},
			} );
		},
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( reOrderedGroups ) => {
				await queryClient.cancelQueries( 'groups' );

				const previousValue = queryClient.getQueryData( 'groups' );

				queryClient.setQueryData( 'groups', reOrderedGroups );

				return previousValue;
			},
			onSuccess: () => {
				setNotification(
					'success',
					__( 'Option groups successfully reordered', 'woocommerce-product-options' ),
					true,
					true
				);
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							'There was an issue while saving your new group order: %s<br>Please try again.',
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: () => {
				queryClient.invalidateQueries( 'groups' );
			},
		}
	);
}

export function useGroupsVisibility() {
	return useQuery( [ 'groupVisibility', id ], () =>
		apiFetch( {
			path: `/wc-product-options/v1/groups/${ id }/visibility`,
		} )
	);
}

export function useToggleGroup() {
	const queryClient = useQueryClient();
	const { setNotification, clearNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) => {
			return apiFetch( {
				path: '/wc-product-options/v1/groups/toggle?_method=PUT',
				method: 'PUT',
				data,
			} );
		},
		{
			onMutate: async ( data ) => {
				clearNotification();

				const previousValue = queryClient.getQueryData( 'groups' );

				const { group: id, visibility } = data;
				const groups = queryClient.getQueryData( 'groups' );

				groups.map( ( group ) => {
					if ( group.id === id ) {
						group.visibility = visibility;
					}
				} );

				queryClient.setQueryData( 'groups', groups );

				return previousValue;
			},
			onSuccess: ( data ) => {
				// do nothing
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification(
					'error',
					sprintf(
						__ (
							'There was an issue while updating the status of the group: %s<br>Please try again later.',
							'woocommerce-product-options'
						),
						error.message
					)
				);
				queryClient.setQueryData( 'groups', previousValue );
			},
			// After success or failure, refetch the groups query
			onSettled: () => {
				// do nothing
			},
		}
	);
}
