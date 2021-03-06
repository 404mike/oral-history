class ApplicationController < ActionController::Base
  protect_from_forgery
  
  before_filter :store_location

  def store_location
    # store last url - this is needed for post-login redirect to whatever the user last visited.
    if (request.fullpath != "/users/sign_in" &&
        request.fullpath != "/users/sign_up" &&
        request.fullpath != "/users/password" &&
        request.fullpath != "/users/sign_out" &&
        request.fullpath != "/auth/google_oauth2" &&
        request.fullpath != "/oauth2callback" &&
        request.fullpath != "/users/auth/google_oauth2/callback" &&
        !request.xhr?) # don't store ajax calls
      session[:previous_url] = request.fullpath 
    end
  end
  
  def after_sign_in_path_for(resource)
    if is_admin?
      admin_path
    else
      root_path
    end    
  end
  
  def is_admin?
    # Admin must have @nypl.org email address
    user_signed_in? and ( current_user.email.split("@").last == "nypl.org" or not Rails.env.production? )
  end
  
  def authenticate_admin!    
    unless is_admin?
      flash[:notice] = "You do not have permission to perform this action"
      redirect_to new_user_registration_path
    end
  end
  
end
