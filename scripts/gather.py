#!/usr/bin/env python
import os
import os.path
import shutil
import subprocess


in_path = "/Users/eric/Library/Application Support/Google/Chrome/Default/File System/013/p/"
out_path = "/Users/WebstormProjects/gl-water2d/frames11/"

in_file_num = 0
out_frame_num = 0

# create output directory if necessary.
if not os.path.exists(out_path):
    os.makedirs(out_path)

while True:

    if in_file_num % 100 == 0:
        print "Copied ", in_file_num, "frames"

    in_file_num_str = str(in_file_num).rjust(8,'0')
    in_sub_dir = str(int(in_file_num / 100) ).rjust(2,'0') + "/"

    in_full_path = os.path.join(in_path, in_sub_dir,in_file_num_str)


    in_full_path_tga = in_full_path + ".tga"

    if not os.path.isfile(in_full_path):
         break

#    print in_full_path
    os.rename(in_full_path, in_full_path_tga)



    out_file = "frame" + str(out_frame_num).rjust(8,'0') + ".png"
    out_full_path = os.path.join(out_path, out_file)

    #print "copy ", in_full_path_tga, " to ", out_full_path

    subprocess.call([  "gm", "convert", in_full_path_tga, out_full_path  ]   )

    # shutil.copyfile(in_full_path, out_full_path )


    in_file_num = in_file_num + 1
    out_frame_num = out_frame_num + 1
